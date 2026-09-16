#!/usr/bin/env node
/**
 * Extrai URLs individuais de listagens Compacto Imóveis (KSI).
 * Uso: node scrape-compacto.mjs <url_listagem> <arquivo_saida>
 */
import fs from 'node:fs'

const [listingUrl, outputPath] = process.argv.slice(2)

if (!listingUrl || !outputPath) {
  console.error('Uso: node scrape-compacto.mjs <url_listagem> <arquivo_saida>')
  process.exit(1)
}

const urlRe =
  /(?:https:\/\/www\.compactoimoveis\.com\.br\/)?(?:alugar|comprar)\/Sao-Jose-do-Rio-Preto\/Comercial\/[^"'\s<>]+\/\d+/g

function normalize(u) {
  u = u.replace(/&amp;/g, '&')
  if (!u.startsWith('http')) {
    u = `https://www.compactoimoveis.com.br/${u.replace(/^\//, '')}`
  }
  return u
}

function canonicalBase(url) {
  const u = new URL(url)
  u.searchParams.delete('pag')
  u.searchParams.delete('page')
  u.searchParams.delete('p')
  return u.toString()
}

function pageUrl(base, page) {
  if (page === 1) return base
  const u = new URL(base)
  u.searchParams.set('pag', String(page))
  return u.toString()
}

function extractUrls(html) {
  const found = new Set()
  for (const m of html.matchAll(urlRe)) {
    found.add(normalize(m[0]))
  }
  return [...found].sort()
}

function detectMaxPage(html, page1Count) {
  const pageNums = [...html.matchAll(/[?&]pag=(\d+)/g)].map((m) => Number(m[1]))
  const titleMatch = html.match(/(\d+)\s+im[óo]veis/i)
  const fromNav = pageNums.length ? Math.max(...pageNums) : 1
  const fromTitle =
    titleMatch && page1Count > 0
      ? Math.ceil(Number(titleMatch[1]) / page1Count)
      : fromNav
  return Math.max(fromNav, fromTitle, 1)
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; extrair-urls-listagem/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

const base = canonicalBase(listingUrl)
const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

const html1 = await fetchHtml(pageUrl(base, 1))
const urls1 = extractUrls(html1)
if (urls1.length === 0) {
  console.error('Nenhuma URL encontrada na página 1. O site pode exigir navegador/JS.')
  process.exit(1)
}

const maxPage = detectMaxPage(html1, urls1.length)
const lines = [
  `# Listagem: ${base}`,
  `# Extraído em: ${today}`,
  `# Método paginação: links ?pag=N e/ou contagem no título`,
  '',
]

const all = new Set()
const perPage = []

for (let page = 1; page <= maxPage; page++) {
  const url = pageUrl(base, page)
  const html = page === 1 ? html1 : await fetchHtml(url)
  const urls = extractUrls(html)
  perPage.push(urls.length)
  lines.push(`# Página ${page} — ${url} (${urls.length} imóveis)`)
  for (const u of urls) {
    lines.push(u)
    all.add(u)
  }
  lines.push('')
}

lines.push(`# Total único: ${all.size} imóveis`)
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')

console.log(`Arquivo: ${outputPath}`)
console.log(`Páginas: ${maxPage}`)
console.log(`URLs por página: ${perPage.join(', ')}`)
console.log(`Total único: ${all.size}`)
