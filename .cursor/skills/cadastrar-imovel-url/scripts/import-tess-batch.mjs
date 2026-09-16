#!/usr/bin/env node
/**
 * Importa URLs individuais da Tess (tess.txt) para POST /api/properties.
 * Uso: node .cursor/skills/cadastrar-imovel-url/scripts/import-tess-batch.mjs [arquivo.txt]
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { isExactAddress, resolveCoordinates } from './geocode-utils.mjs'

const API_BASE = process.env.API_BASE ?? 'http://localhost:3001'
const INPUT = resolve(process.argv[2] ?? 'tess.txt')
const TODAY = '16/09/2026'
const UA = 'Mozilla/5.0 (compatible; sala-comercial-josi/1.0)'

const geocodeCache = new Map()

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function parseUrlsFromFile(path) {
  const lines = readFileSync(path, 'utf8').split('\n')
  return [...new Set(lines.map((l) => l.trim()).filter((l) => /^https?:\/\//.test(l)))]
}

function extractCodigo(url) {
  const m = url.match(/\/(\d+)\/?$/)
  return m ? m[1] : null
}

function normalizeUrl(url) {
  return url.replace(/\/+$/, '').split('#')[0]
}

function parseMoney(text) {
  if (!text) return null
  const cleaned = text.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) && n > 0 ? n : null
}

function parseArea(text) {
  if (!text) return null
  const cleaned = text.replace(/\./g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function stripTags(html) {
  return decodeHtml(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function parsePropertyHtml(html, url) {
  const codigo =
    html.match(/id="codigorel"[^>]*value="(\d+)"/)?.[1] ??
    extractCodigo(url)

  const h1 = stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '')
  const title = h1.replace(/\s*\|\s*Cód\.?:\s*\d+\s*$/i, '').trim()

  const locationRaw = html.match(/fa-map-marker"><\/i>([^<]+)/i)?.[1]?.trim() ?? ''
  const [bairroPart, cidadePart] = locationRaw.split(/\s*-\s*/)
  const bairro = (bairroPart ?? 'Não informado').trim()
  let endereco = locationRaw || bairro

  const aluguelText =
    html.match(/<h3>\s*<span>(R\$[^<]+)<\/span>\s*<\/h3>/i)?.[1] ??
    html.match(/id="valorrel"[^>]*value="([^"]+)"/i)?.[1]
  const aluguelRaw = (aluguelText ?? '').trim()
  const aluguel =
    /sob consulta/i.test(aluguelRaw) ? null : parseMoney(aluguelRaw)

  const areaCandidates = [...html.matchAll(/(\d[\d.,]+)\s*m²(?:\s*(?:Privativos?|Privativa|Constru|de Terreno|Útil))?/gi)]
    .map((m) => parseArea(m[1]))
    .filter((n) => n != null && n > 1)

  const privMatch =
    html.match(/(\d[\d.,]+)\s*m²\s*Privativos?/i) ??
    html.match(/(\d[\d.,]+)\s*m²\s*Privativa/i) ??
    html.match(/(\d[\d.,]+)\s*m²\s*Constru/i)

  const areaM2 =
    parseArea(privMatch?.[1]) ??
    (areaCandidates.length ? Math.max(...areaCandidates) : null)

  const iptu = html.match(/IPTU:\s*R\$\s*([^<]+)/i)?.[1]?.trim()
  const condominio = html.match(/Condomínio:\s*R\$\s*([^<]+)/i)?.[1]?.trim()

  const terrenoMatch = html.match(/(\d[\d.,]+)\s*m²\s*de\s*Terreno/i)
  const terrenoM2 = terrenoMatch ? parseArea(terrenoMatch[1]) : null

  const mapQuery = decodeHtml(html.match(/maps\?q=([^&"]+)/i)?.[1] ?? '')
  if (isExactAddress(mapQuery)) {
    endereco = mapQuery.includes('São José') ? mapQuery : `${mapQuery}, São José do Rio Preto`
  }

  let latitude = null
  let longitude = null
  let coordNote = null

  if (isExactAddress(endereco)) {
    const coords = [...html.matchAll(/(-?\d{2}\.\d{5,})/g)].map((m) => m[1])
    const uniq = [...new Set(coords)]
    if (uniq.length >= 2) {
      latitude = Number(uniq[0])
      longitude = Number(uniq[1])
      coordNote = 'Coordenadas: anúncio (mapa com endereço exato)'
    }
  }

  const encargosParts = []
  if (iptu && iptu !== '0,00') encargosParts.push(`+ IPTU R$ ${iptu}`)
  if (condominio && condominio !== '0,00') encargosParts.push(`+ cond. R$ ${condominio}`)

  const tipo = html.match(/id="tipoimovelrel"[^>]*value="([^"]+)"/i)?.[1] ?? 'Salão'
  const descricao = title
    ? title.slice(0, 120)
    : `${tipo} — ${bairro}`

  const observacoesParts = [`Ref. Tess ${codigo ?? '?'}`]
  if (terrenoM2 && terrenoM2 !== areaM2) {
    observacoesParts.push(`Terreno: ${terrenoM2} m²`)
  }
  if (cidadePart) observacoesParts.push(`Cidade: ${cidadePart.trim()}`)

  return {
    codigo,
    title,
    bairro,
    endereco,
    aluguel,
    areaM2,
    encargos: encargosParts.length ? encargosParts.join(' ') : null,
    latitude,
    longitude,
    descricao,
    observacoes: observacoesParts.join('. '),
    coordNote,
    url: normalizeUrl(url),
  }
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function getExistingProperties() {
  const res = await fetch(`${API_BASE}/api/properties`)
  if (!res.ok) throw new Error(`API GET failed: ${res.status}`)
  const json = await res.json()
  return json.data ?? []
}

function isDuplicate(existing, parsed) {
  const norm = parsed.url
  const codigo = parsed.codigo

  for (const p of existing) {
    const pUrl = normalizeUrl(p.url ?? '')
    if (pUrl === norm) return p.id

    const pCodigo = extractCodigo(pUrl) ?? (p.observacoes?.match(/Ref\. Tess (\d+)/)?.[1])
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
  if (!res.ok) {
    throw new Error(JSON.stringify(body))
  }
  return body.data ?? body
}

async function main() {
  const urls = parseUrlsFromFile(INPUT)
  console.log(`URLs no arquivo: ${urls.length}`)

  const existing = await getExistingProperties()
  console.log(`Imóveis já na API: ${existing.length}`)

  const report = {
    cadastrados: [],
    duplicados: [],
    erros: [],
  }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    const codigo = extractCodigo(url)
    process.stdout.write(`[${i + 1}/${urls.length}] ${codigo ?? '?'} `)

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
        imobiliaria: 'Tess',
        descricao: parsed.descricao,
        bairro: parsed.bairro,
        endereco: parsed.endereco,
        areaM2: parsed.areaM2,
        aluguel: parsed.aluguel,
        encargos: parsed.encargos,
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
      report.cadastrados.push({ id: created.id, url: parsed.url, codigo: parsed.codigo })
      await sleep(300)
    } catch (err) {
      console.log(`→ ERRO: ${err.message}`)
      report.erros.push({ url, codigo, error: err.message })
    }
  }

  const outPath = resolve('tess-import-report.json')
  writeFileSync(outPath, JSON.stringify(report, null, 2))

  console.log('\n--- Resumo ---')
  console.log(`Cadastrados: ${report.cadastrados.length}`)
  console.log(`Duplicados:  ${report.duplicados.length}`)
  console.log(`Erros:       ${report.erros.length}`)
  console.log(`Relatório:   ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
