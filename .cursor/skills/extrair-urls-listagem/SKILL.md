---
name: extrair-urls-listagem
description: Extrai URLs individuais de imóveis a partir de uma página de listagem ou busca, percorre todas as páginas de paginação e salva em arquivo de texto. Use quando o usuário passar URL de resultados, pedir para coletar/salvar links de anúncios ou extrair URLs de uma pesquisa imobiliária.
---

# Extrair URLs de listagem imobiliária

Colete URLs individuais de anúncios a partir de uma página de resultados e salve em arquivo.

## Entrada

- Exija uma URL HTTP(S) de **listagem** (busca, categoria ou resultados paginados).
- **Sempre** confirme o arquivo de saída com o usuário **antes** de extrair:
  - Se ele não informou o nome, pergunte: *"Qual nome de arquivo devo usar? (ex.: compacto.txt)"*
  - Se informou, confirme se deve **criar** ou **sobrescrever/atualizar** o existente.
  - Caminho padrão: raiz do projeto, salvo se o usuário indicar outro.
- Não comece a extração sem resposta sobre o arquivo.

## Fluxo obrigatório

1. Abra a URL com navegador e leia o conteúdo renderizado.
2. **Normalize para a página 1** da pesquisa:
   - Remova parâmetros de paginação da URL (`pag`, `page`, `p`, etc.).
   - Use essa URL canônica como base para montar as demais páginas.
3. **Calcule o total de páginas** antes de iterar (veja [reference.md](reference.md)).
4. Extraia as URLs individuais da página 1.
5. Para cada página `2 … total`, navegue ou busque o HTML e extraia as URLs.
6. Monte o arquivo conforme o formato abaixo e salve no caminho acordado.
7. Informe resumo: arquivo, páginas percorridas, URLs por página e total único.

## O que é URL individual

Incluir apenas links que apontam para **um anúncio específico**, em geral:

- terminam em ID numérico (`…/29244`, `…/id/12345`); ou
- têm padrão inequívoco de detalhe no site (slug + código).

Excluir:

- URL da própria listagem ou categoria sem ID;
- links de bairro, tipo de imóvel ou filtros;
- favoritos, comparar, WhatsApp, redes sociais, termos, privacidade;
- duplicatas do mesmo anúncio na mesma página (normalizar antes de listar).

## Normalização

- Converter URLs relativas para absolutas (`alugar/...` → `https://dominio/...`).
- Remover fragmentos (`#...`) e parâmetros de tracking desnecessários, mantendo o path canônico.
- Preservar `http`/`https` e domínio originais.
- Ordenar alfabeticamente dentro de cada página (facilita diff e auditoria).

## Paginação

Prioridade para descobrir quantas páginas existem:

1. **Links numéricos** no rodapé (1, 2, 3 …) — o maior número visível é candidato a total; confirme se a última página repete resultados.
2. **Contagem no título ou cabeçalho** (ex.: "140 imóveis") ÷ itens únicos na página 1 ≈ total de páginas (arredondar para cima).
3. **Parâmetro de paginação** detectado no site (`?pag=2`, `?page=2`, `/pagina/2`, etc.) — reutilize o mesmo padrão.
4. **Parada segura**: se uma página retornar 0 URLs novas e repetir a anterior, considere que a paginação terminou; não invente páginas além do necessário.

Registre em comentário no arquivo qual método foi usado quando não for óbvio.

## Formato do arquivo

```text
# Listagem: {url_canonica_pagina_1}
# Extraído em: {DD/MM/AAAA}
# Método paginação: {descrição breve}

# Página 1 — {url_pagina_1} ({N} imóveis)
https://...
https://...

# Página 2 — {url_pagina_2} ({N} imóveis)
https://...

# Total único: {X} imóveis
```

- Se o arquivo **já existir** e o usuário pediu para atualizar, substitua o conteúdo inteiro (não append silencioso), salvo instrução contrária.
- Mantenha uma linha em branco entre seções de página.

## Extração

Ordem de preferência:

1. **Navegador** (`browser_navigate` + `browser_cdp`): DOM renderizado e paginação visível.
2. **HTML via fetch/curl** quando o site entrega links no HTML inicial (sem depender só de JS).
3. Inspecionar `href` em cards de imóvel; se necessário, ampliar seletores conforme [reference.md](reference.md).

Não pare na página 1 se houver evidência de paginação.

## Validação antes de salvar

- Pelo menos 1 URL individual na página 1; se 0, reporte bloqueio (login, captcha, JS-only) em vez de gravar arquivo vazio.
- Total de páginas coerente com contagem do site quando disponível.
- Total único ≤ soma das páginas (duplicatas entre páginas são possíveis na última página).

## Resultado

Responda de forma curta:

```text
Arquivo: {caminho}
Listagem: {url_canonica}
Páginas: {total}
URLs por página: {n1}, {n2}, …
Total único: {X}
```

## Relação com outras skills

- Esta skill **só coleta URLs**; não cadastra imóveis.
- Para importar cada URL no painel, use a skill `cadastrar-imovel-url`.
