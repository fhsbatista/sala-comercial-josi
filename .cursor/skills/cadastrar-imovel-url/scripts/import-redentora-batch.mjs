#!/usr/bin/env node
/**
 * Importa URLs Redentora a partir de redentora.txt.
 * Uso: node import-redentora-batch.mjs [redentora.txt] [--only-alugar]
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { isExactAddress, resolveCoordinates } from './geocode-utils.mjs'

const API_BASE = process.env.API_BASE ?? 'http://localhost:3001'
const INPUT = resolve(process.argv[2] ?? 'redentora.txt')
const ONLY_ALUGAR = process.argv.includes('--only-alugar')
const FALLBACK_AREA = process.argv.includes('--fallback-area')
  ? Number(process.argv[process.argv.indexOf('--fallback-area') + 1])
  : null
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
  return url.match(/\/(\d+)\/?$/)?.[1] ?? null
}

function normalizeUrl(url) {
  return url.replace(/\/+$/, '').split('#')[0]
}

function decodeEntities(text) {
  return (text ?? '')
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
    .replace(/&ordm;/g, 'º')
}

function parseMoney(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  if (/^\d+\.\d{1,2}$/.test(s)) return Math.round(Number(s))
  if (/^\d+,\d{1,2}$/.test(s)) return Math.round(Number(s.replace(',', '.')))
  const n = Number(s.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

function parseAreaNumber(raw) {
  return parseMoney(raw)
}

function bairroFromUrl(url) {
  const parts = url.split('/')
  const types = ['Salao', 'Sala', 'Casa-Comercial', 'Galpao', 'Loja', 'Ponto-Comercial']
  for (const t of types) {
    const idx = parts.findIndex((p) => p === t)
    if (idx >= 0 && parts[idx + 1]) {
      return decodeEntities(parts[idx + 1].replace(/-/g, ' '))
    }
  }
  return null
}

function parseAluguel(html, url) {
  const isAlugarPath = url.includes('/alugar/')

  if (isAlugarPath) {
    const jsonPrice = html.match(/"price"\s*:\s*"([\d.]+)"/)?.[1]
    if (jsonPrice) return parseMoney(jsonPrice)
  }

  const desc = decodeEntities(html.match(/meta name="description" content="([^"]+)"/i)?.[1] ?? '')
  const metaRent = desc.match(/R\$\s*([\d.,]+)\s*aluguel/i)
  if (metaRent) return parseMoney(metaRent[1])

  if (!isAlugarPath) {
    const metaRent2 = desc.match(/R\$\s*([\d.,]+),?\d*\s*L/i)
    if (metaRent2) return parseMoney(metaRent2[1])
  }

  for (const block of html.matchAll(/id="valores_imovel"[\s\S]*?(?=card-valores|<section class="container|<footer|$)/gi)) {
    const chunk = block[0]
    const m = chunk.match(/>\s*Aluguel\s*<[\s\S]{0,350}?>([\d.,]+)</i)
    if (m) return parseMoney(m[1])
  }

  if (isAlugarPath) {
    const descPrice = desc.match(/R\$\s*([\d.,]+)/)
    if (descPrice) return parseMoney(descPrice[1])
  }

  return null
}

function parseEncargos(html) {
  const parts = []
  for (const block of html.matchAll(/id="valores_imovel"[\s\S]*?(?=card-valores|<section class="container|<footer|$)/gi)) {
    const chunk = block[0]
    const iptu = chunk.match(/>\s*IPTU[\s\S]{0,400}?col-5 text-end mt-2[^>]*>\s*([\d.,]+)/i)?.[1]
    const cond = chunk.match(/>\s*Condom[ií]nio[\s\S]{0,400}?col-5 text-end mt-2[^>]*>\s*([\d.,]+)/i)?.[1]
    if (iptu && iptu !== '0,00' && iptu !== '0.00') parts.push(`+ IPTU R$ ${iptu}`)
    if (cond && cond !== '0,00' && cond !== '0.00') parts.push(`+ cond. R$ ${cond}`)
    if (parts.length) break
  }
  return parts.length ? parts.join(' ') : null
}

function mainPropertyHtml(html) {
  const start = html.search(/class='titulo-imovel'|class="titulo-imovel"/i)
  if (start < 0) return html
  const endMarkers = [
    html.indexOf('class="card-valores"', start),
    html.indexOf('id="valores_imovel"', start),
    html.indexOf('>Imóveis similares<', start),
    html.indexOf('>Im&oacute;veis similares<', start),
  ].filter((i) => i > start)
  const end = endMarkers.length ? Math.min(...endMarkers) : start + 12000
  return html.slice(start, end)
}

function parseAreaFromText(text) {
  const patterns = [
    /&Aacute;rea\s*&Uacute;til:\s*([\d.,]+)\s*m&sup2;/i,
    /&Aacute;rea\s*Constru&iacute;da:\s*([\d.,]+)\s*m&sup2;/i,
    /&Aacute;rea\s*do\s*Terreno:\s*([\d.,]+)\s*m&sup2;/i,
    /(\d[\d.,]+)\s*m²/i,
    /(\d[\d.,]+)\s*m&sup2;/i,
    /(\d[\d.,]+)\s*M2\b/i,
    /rea\s*útil\s*de\s*(\d[\d.,]+)/i,
    /rea\s*constru[ií]da\s*de\s*(\d[\d.,]+)/i,
    /com\s*(\d[\d.,]+)\s*m(?:²|2|\b)/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) return parseAreaNumber(m[1])
  }
  return null
}

function parseAreaFromHtml(html) {
  const main = mainPropertyHtml(html)

  const util = main.match(/a-util-ico-imo[\s\S]{0,220}?fw-bold">([\d.,]+)\s*m&sup2;/i)
  if (util) return parseAreaNumber(util[1])

  const constr = main.match(/a-const-ico-imo[\s\S]{0,220}?fw-bold">([\d.,]+)\s*m&sup2;/i)
  if (constr) return parseAreaNumber(constr[1])

  const terr = main.match(/a-terr-ico-imo[\s\S]{0,220}?fw-bold">([\d.,]+)\s*m&sup2;/i)
  if (terr) return parseAreaNumber(terr[1])

  const descSources = [
    decodeEntities(html.match(/"description"\s*:\s*"([^"]+)"/)?.[1] ?? ''),
    decodeEntities(main.match(/class="descricao-imovel"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? ''),
    decodeEntities(main),
  ]
  for (const src of descSources) {
    const area = parseAreaFromText(src)
    if (area) return area
  }

  return null
}

function parseEndereco(html, bairro) {
  const locSection = html.match(
    /titulos-pag-imovel">Localiza[\s\S]{0,800}?(?:<p[^>]*>([^<]+)<\/p>|endereco[^>]*>([^<]+)<)/i,
  )
  const candidate = decodeEntities(locSection?.[1] ?? locSection?.[2] ?? '').trim()
  if (candidate && isExactAddress(candidate)) return candidate

  const bodyDesc = decodeEntities(html.match(/class="descricao-imovel"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '')
  const streetInDesc = bodyDesc.match(/\b((?:Rua|Av\.|Avenida|Rodovia|Alameda|Travessa|Estrada)[^.<,\n]{5,80})/i)
  if (streetInDesc) {
    const addr = streetInDesc[1].trim()
    if (isExactAddress(addr)) return `${addr}, São José do Rio Preto`
  }

  return `${bairro} - São José do Rio Preto`
}

function parsePropertyHtml(html, url) {
  const codigo = html.match(/"sku"\s*:\s*"(\d+)"/)?.[1] ?? extractCodigo(url)
  const title = decodeEntities(html.match(/<h1 class='titulo-imovel'>([^<]+)<\/h1>/i)?.[1] ?? '')
  const bairro = bairroFromUrl(url) ?? 'Não informado'
  const endereco = parseEndereco(html, bairro)
  const aluguel = parseAluguel(html, url)
  const areaM2 = parseAreaFromHtml(html)
  const encargos = parseEncargos(html)
  const descricao = (title || `${bairro} — comercial`).slice(0, 120)

  let latitude = null
  let longitude = null
  let coordNote = ''
  const exactAddr = isExactAddress(endereco)

  const mapMatch = html.match(
    /initLeafletMap\(\s*"map_leaflet",\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)/i,
  )

  if (!exactAddr && mapMatch) {
    latitude = Number(mapMatch[1])
    longitude = Number(mapMatch[2])
    coordNote = 'Coordenadas: anúncio (mapa Leaflet)'
  }

  const terrenoMatch = html.match(/a-terr-ico-imo[\s\S]{0,220}?fw-bold">([\d.,]+)\s*m&sup2;/i)
  const terrenoM2 = terrenoMatch ? parseAreaNumber(terrenoMatch[1]) : null

  const observacoesParts = [`Ref. Redentora ${codigo ?? '?'}`]
  if (terrenoM2 && terrenoM2 !== areaM2) {
    observacoesParts.push(`Terreno: ${terrenoM2} m²`)
  }
  if (url.includes('/comprar/') && !url.includes('/alugar/')) {
    observacoesParts.push('URL de comprar; aluguel extraído quando disponível')
  }

  return {
    codigo,
    descricao,
    bairro,
    endereco,
    aluguel,
    areaM2,
    encargos,
    latitude,
    longitude,
    coordNote,
    observacoes: observacoesParts.join('. '),
    url: normalizeUrl(url),
  }
}

async function fetchHtml(url, retries = 4) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = await res.arrayBuffer()
      return new TextDecoder('latin1').decode(buf)
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(800 * attempt)
    }
  }
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
    const pCodigo =
      extractCodigo(pUrl) ??
      p.observacoes?.match(/Ref\. (?:Redentora|Compacto|Tess) (\d+)/)?.[1]
    if (codigo && pCodigo === codigo && p.imobiliaria === parsed.imobiliaria) return p.id
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
  let urls = parseUrlsFromFile(INPUT)
  if (ONLY_ALUGAR) urls = urls.filter((u) => u.includes('/alugar/'))

  console.log(`URLs no arquivo: ${urls.length}`)
  if (ONLY_ALUGAR) console.log('(filtro --only-alugar ativo)')

  const existing = await getExistingProperties()
  console.log(`Imóveis já na API: ${existing.length}`)

  const report = { cadastrados: [], duplicados: [], erros: [] }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    const codigo = extractCodigo(url)
    process.stdout.write(`[${i + 1}/${urls.length}] ${codigo ?? '?'} `)

    try {
      const dupId = isDuplicate(existing, { url, codigo, imobiliaria: 'Redentora' })
      if (dupId) {
        console.log(`→ duplicado (ID ${dupId})`)
        report.duplicados.push({ url, id: dupId, codigo })
        continue
      }

      const html = await fetchHtml(url)
      const parsed = parsePropertyHtml(html, url)

      if (!parsed.aluguel) throw new Error('aluguel não encontrado')

      let areaM2 = parsed.areaM2
      let areaNote = null
      if (!areaM2) {
        if (FALLBACK_AREA && FALLBACK_AREA > 0) {
          areaM2 = FALLBACK_AREA
          areaNote = `Área não informada no anúncio; cadastrado com ${FALLBACK_AREA} m² (placeholder)`
        } else {
          throw new Error('área não encontrada')
        }
      }

      const resolved = await resolveCoordinates(parsed, { cache: geocodeCache, sleep })
      const observacoes = areaNote
        ? `${resolved.observacoes}. ${areaNote}`
        : resolved.observacoes

      const payload = {
        imobiliaria: 'Redentora',
        descricao: parsed.descricao,
        bairro: parsed.bairro,
        endereco: parsed.endereco,
        areaM2,
        aluguel: parsed.aluguel,
        encargos: parsed.encargos,
        url: parsed.url,
        tipoUrl: 'individual',
        status: 'verificado',
        ultimaVerificacao: TODAY,
        observacoes,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
      }

      const created = await postProperty(payload)
      existing.push(created)
      console.log(`→ ID ${created.id} (${parsed.bairro}, R$ ${parsed.aluguel}, ${areaM2} m²)`)
      report.cadastrados.push({ id: created.id, url: parsed.url, codigo })
      await sleep(250)
    } catch (err) {
      console.log(`→ ERRO: ${err.message}`)
      report.erros.push({ url, codigo, error: err.message })
    }
  }

  const outPath = resolve('redentora-import-report.json')
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
