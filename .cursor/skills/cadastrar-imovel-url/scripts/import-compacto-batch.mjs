#!/usr/bin/env node
/**
 * Importa URLs Compacto a partir de compacto.txt (páginas 2+ por padrão).
 * Uso: node import-compacto-batch.mjs [compacto.txt] [--from-page 2]
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isExactAddress, resolveCoordinates } from './geocode-utils.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const API_BASE = process.env.API_BASE ?? 'http://localhost:3001'
const INPUT = resolve(process.argv[2] ?? 'compacto.txt')
const FROM_PAGE = Number(process.argv.includes('--from-page')
  ? process.argv[process.argv.indexOf('--from-page') + 1]
  : 2)
const TODAY = '16/09/2026'
const UA = 'Mozilla/5.0 (compatible; sala-comercial-josi/1.0)'

const geocodeCache = new Map()

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function parseUrlsFromFile(path, fromPage) {
  const lines = readFileSync(path, 'utf8').split('\n')
  const urls = []
  let currentPage = 0
  for (const line of lines) {
    const pageMatch = line.match(/^# Página (\d+)/)
    if (pageMatch) currentPage = Number(pageMatch[1])
    if (currentPage < fromPage) continue
    const trimmed = line.trim()
    if (/^https?:\/\//.test(trimmed)) urls.push(trimmed)
  }
  return [...new Set(urls)]
}

function extractCodigo(url) {
  return url.match(/\/(\d+)\/?$/)?.[1] ?? null
}

function normalizeUrl(url) {
  return url.replace(/\/+$/, '').split('#')[0]
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&atilde;/g, 'ã')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&sup2;/g, '²')
    .replace(/&nbsp;/g, ' ')
}

function parseAreaNumber(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  if (/^\d+\.\d{1,2}$/.test(s)) return Math.round(Number(s))
  if (/^\d+,\d{1,2}$/.test(s)) return Math.round(Number(s.replace(',', '.')))
  const n = Number(s.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

function parseAreaFromText(text) {
  const m = text.match(/(\d[\d.,]+)\s*m²/i)
  return m ? parseAreaNumber(m[1]) : null
}

function parseAreaFromHtml(html) {
  const blocks = [...html.matchAll(
    /<strong class="fw-bold">(\d[\d.,]+)\s*m&sup2;<\/strong><\/div><\/div>([^<]{0,40})/gi,
  )]

  for (const m of blocks) {
    const label = decodeEntities(m[2]).toLowerCase()
    if (/útil|util|constru/i.test(label)) {
      return parseAreaNumber(m[1])
    }
  }

  for (const m of blocks) {
    const label = decodeEntities(m[2]).toLowerCase()
    if (!/terreno/i.test(label)) {
      return parseAreaNumber(m[1])
    }
  }

  const inline = html.match(/(\d[\d.,]+)\s*m&sup2;\s*de\s*&aacute;rea\s*&uacute;til/i)
  if (inline) return parseAreaNumber(inline[1])

  return null
}

function bairroFromUrl(url) {
  const parts = url.split('/')
  const idx = parts.findIndex((p) => p === 'Salao')
  if (idx >= 0 && parts[idx + 1]) {
    return decodeEntities(parts[idx + 1].replace(/-/g, ' '))
  }
  return null
}

function parsePropertyHtml(html, url) {
  const codigo = html.match(/"sku"\s*:\s*"(\d+)"/)?.[1] ?? extractCodigo(url)
  const titleRaw = html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? ''
  const title = decodeEntities(titleRaw)
  const name = decodeEntities(html.match(/"name"\s*:\s*"([^"]+)"/)?.[1] ?? title)
  const priceRaw = html.match(/"price"\s*:\s*"([\d.]+)"/)?.[1]
  const aluguel = priceRaw ? Math.round(Number(priceRaw)) : null
  const areaM2 =
    parseAreaFromHtml(html) ??
    parseAreaFromText(name) ??
    parseAreaFromText(title)
  const bairroMatch = name.match(/Bairro\s+([^|"]+)/i) ?? title.match(/Bairro\s+([^|"]+)/i)
  const bairro = (bairroMatch?.[1] ?? bairroFromUrl(url) ?? 'Não informado').trim()
  const street = decodeEntities(html.match(/"streetAddress"\s*:\s*"([^"]*)"/)?.[1] ?? '')
  const locality = decodeEntities(html.match(/"addressLocality"\s*:\s*"([^"]*)"/)?.[1] ?? '')
  const endereco = street
    ? [street, locality || 'São José do Rio Preto'].filter(Boolean).join(', ')
    : `${bairro} - São José do Rio Preto`

  let latitude = null
  let longitude = null
  let coordNote = ''
  const exactAddr = isExactAddress(endereco)

  const jsonLat = html.match(/"latitude"\s*:\s*"?(-?\d+\.\d+)"?/i)?.[1]
  const jsonLng = html.match(/"longitude"\s*:\s*"?(-?\d+\.\d+)"?/i)?.[1]

  if (exactAddr && jsonLat && jsonLng) {
    latitude = Number(jsonLat)
    longitude = Number(jsonLng)
    coordNote = 'Coordenadas: anúncio (endereço exato no JSON-LD)'
  } else if (!exactAddr) {
    const mapMatch = html.match(
      /initLeafletMap\(\s*"map_leaflet",\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)/i,
    )
    if (mapMatch) {
      latitude = Number(mapMatch[1])
      longitude = Number(mapMatch[2])
      coordNote = 'Coordenadas: anúncio (mapa Leaflet)'
    } else if (jsonLat && jsonLng) {
      latitude = Number(jsonLat)
      longitude = Number(jsonLng)
      coordNote = 'Coordenadas: anúncio (JSON-LD/mapa)'
    }
  }

  const isAlugar = url.includes('/alugar/')
  let descricao = name.split('|').slice(0, 2).join(' | ').trim()
  if (!descricao || /^comercial\s*-\s*sal[aã]o$/i.test(descricao)) {
    const fromTitle = title.replace(/\s*R\$\s*[\d.,]+.*$/i, '').replace(/\.\s*Cód\.:.*$/i, '').trim()
    descricao = fromTitle || title.slice(0, 120)
  }
  descricao = descricao.slice(0, 120)

  const observacoesParts = [`Ref. Compacto ${codigo ?? '?'}`]
  if (!isAlugar) observacoesParts.push('Anúncio de venda (comprar); não importado como aluguel')
  if (coordNote) observacoesParts.push(coordNote)

  return {
    codigo,
    descricao,
    bairro,
    endereco,
    aluguel,
    areaM2,
    latitude,
    longitude,
    observacoes: observacoesParts.join('. '),
    coordNote,
    url: normalizeUrl(url),
    isAlugar,
  }
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = await res.arrayBuffer()
  return new TextDecoder('latin1').decode(buf)
}

async function getExistingProperties() {
  const res = await fetch(`${API_BASE}/api/properties`)
  const json = await res.json()
  return json.data ?? []
}

function isDuplicate(existing, parsed) {
  const norm = parsed.url
  const codigo = parsed.codigo
  for (const p of existing) {
    const pUrl = normalizeUrl(p.url ?? '')
    if (pUrl === norm) return p.id
    const pCodigo = extractCodigo(pUrl) ?? p.observacoes?.match(/Ref\. Compacto (\d+)/)?.[1]
    if (codigo && pCodigo === codigo) return p.id
  }
  return null
}

async function postProperty(payload) {
  const res = await fetch(`${API_BASE}/api/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(JSON.stringify(body))
  return body.data ?? body
}

async function main() {
  const urls = parseUrlsFromFile(INPUT, FROM_PAGE)
  const alugar = urls.filter((u) => u.includes('/alugar/'))
  const comprar = urls.filter((u) => u.includes('/comprar/'))

  console.log(`URLs únicas (página ${FROM_PAGE}+): ${urls.length}`)
  console.log(`Alugar: ${alugar.length} | Comprar (ignorados): ${comprar.length}`)

  const existing = await getExistingProperties()
  const bairros = [...new Set(alugar.map((u) => bairroFromUrl(u) ?? ''))].filter(Boolean).sort()
  console.log(`\nBairros distintos (via URL, antes do fetch): ${bairros.length}`)

  const report = { cadastrados: [], duplicados: [], ignorados: comprar.map((u) => ({ url: u, motivo: 'comprar/venda' })), erros: [] }

  for (let i = 0; i < alugar.length; i++) {
    const url = alugar[i]
    const codigo = extractCodigo(url)
    process.stdout.write(`[${i + 1}/${alugar.length}] ${codigo} `)

    try {
      const dupId = isDuplicate(existing, { url, codigo })
      if (dupId) {
        console.log(`→ duplicado (ID ${dupId})`)
        report.duplicados.push({ url, id: dupId })
        continue
      }

      const html = await fetchHtml(url)
      const parsed = parsePropertyHtml(html, url)

      if (!parsed.aluguel) throw new Error('aluguel não encontrado')
      if (!parsed.areaM2) throw new Error('área não encontrada')

      const resolved = await resolveCoordinates(parsed, { cache: geocodeCache, sleep })

      const payload = {
        imobiliaria: 'Compacto',
        descricao: parsed.descricao,
        bairro: parsed.bairro,
        endereco: parsed.endereco,
        areaM2: parsed.areaM2,
        aluguel: parsed.aluguel,
        encargos: null,
        proximidade: resolved.proximidade,
        url: parsed.url,
        tipoUrl: 'individual',
        status: 'verificado',
        ultimaVerificacao: TODAY,
        observacoes: resolved.observacoes,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
      }

      const created = await postProperty(payload)
      existing.push(created)
      console.log(`→ ID ${created.id} (${parsed.bairro}, R$ ${parsed.aluguel}, ${parsed.areaM2} m²)`)
      report.cadastrados.push({ id: created.id, url: parsed.url, codigo })
      await sleep(200)
    } catch (err) {
      console.log(`→ ERRO: ${err.message}`)
      report.erros.push({ url, codigo, error: err.message })
    }
  }

  const outPath = resolve('compacto-import-report.json')
  writeFileSync(outPath, JSON.stringify(report, null, 2))
  console.log('\n--- Resumo ---')
  console.log(`Cadastrados: ${report.cadastrados.length}`)
  console.log(`Duplicados:  ${report.duplicados.length}`)
  console.log(`Ignorados (venda): ${report.ignorados.length}`)
  console.log(`Erros:       ${report.erros.length}`)
  console.log(`Relatório:   ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
