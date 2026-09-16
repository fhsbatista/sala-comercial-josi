# Referência — extração e paginação

## Compacto Imóveis (KSI)

Site testado: listagens em `compactoimoveis.com.br`.

### URL de listagem

Exemplo:

```text
https://www.compactoimoveis.com.br/alugar/Sao-Jose-do-Rio-Preto/Comercial/Salao
```

Página 1 = URL sem query. Demais páginas: `?pag=2`, `?pag=3`, …

### Paginação

- Rodapé exibe links `1`, `2`, `3` … e `»` para a próxima.
- O título da página informa o total: `140 imóveis Comercial Salão…`.
- Itens por página: ~27 (varia); `ceil(140 / 27) = 6` páginas reais; `?pag=7` pode repetir a última.
- **Total de páginas**: use o maior número no rodapé **ou** `ceil(total_imoveis / urls_pagina_1)`; pare se a página repetir a anterior.

### URLs individuais no HTML

Links relativos no `href`:

```html
<a href="alugar/Sao-Jose-do-Rio-Preto/Comercial/Salao/Parque-Estoril/29276">
```

Também aparecem como `/alugar/.../ID` ou URL absoluta `https://www.compactoimoveis.com.br/alugar/.../ID`.

Regex útil (após fetch do HTML):

```javascript
/(?:https:\/\/www\.compactoimoveis\.com\.br\/)?(?:alugar|comprar)\/Sao-Jose-do-Rio-Preto\/Comercial\/[^"'\s<>]+\/\d+/g
```

Normalização:

```javascript
function normalize(u) {
  u = u.replace(/&amp;/g, '&')
  if (!u.startsWith('http')) {
    u = 'https://www.compactoimoveis.com.br/' + u.replace(/^\//, '')
  }
  return u
}
```

### CDP no navegador

```javascript
(() => {
  const re = /(?:https:\/\/www\.compactoimoveis\.com\.br\/)?(?:alugar|comprar)\/Sao-Jose-do-Rio-Preto\/Comercial\/[^"'\s<>]+\/\d+/g
  const links = [...document.querySelectorAll('a[href]')]
    .map(a => a.getAttribute('href'))
    .filter(Boolean)
  const found = new Set()
  for (const href of links) {
    for (const m of href.matchAll(re)) found.add(m[0])
  }
  const pagLinks = [...document.querySelectorAll('a')]
    .filter(a => /^\d+$/.test(a.textContent.trim()))
    .map(a => ({ text: a.textContent.trim(), href: a.href }))
  return {
    pageUrl: location.href,
    urls: [...found],
    pagination: pagLinks,
    title: document.title,
  }
})()
```

---

## Padrões genéricos de paginação

| Sinal | Exemplo | Ação |
|-------|---------|------|
| Query `pag` / `page` / `p` | `?pag=2` | Incrementar parâmetro |
| Path | `/page/2`, `/pagina/2` | Substituir segmento |
| Botão "Próxima" | `»`, "Next" | Seguir até sumir ou repetir |
| Contagem total | "N imóveis", "N resultados" | Dividir por itens/página |

### Calcular total de páginas

```text
totalPaginas = max(
  maior_numero_no_rodape,
  ceil(totalResultados / urlsUnicasPagina1)
)
```

Validar navegando até `totalPaginas`; se a última repetir a penúltima, usar a penúltima como fim.

---

## Falsos positivos comuns

| URL | Motivo para excluir |
|-----|---------------------|
| `.../Comercial/Salao` (sem ID) | Categoria |
| `.../Comercial/Salao/Boa-Vista` (sem ID) | Filtro de bairro |
| `wa.me/...?text=https://...` | WhatsApp |
| `/favoritos`, `/comparar` | Funcionalidade do site |
| `/pagina/atuacao-15` | Página institucional |

---

## Script de apoio (fetch)

Quando o HTML já contém os links (Compacto):

```bash
node .cursor/skills/extrair-urls-listagem/scripts/scrape-compacto.mjs \
  "https://www.compactoimoveis.com.br/alugar/Sao-Jose-do-Rio-Preto/Comercial/Salao" \
  compacto.txt
```

Para outros sites, prefira navegador ou adapte regex/seletores com evidência do DOM.
