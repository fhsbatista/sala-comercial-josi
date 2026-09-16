---
name: cadastrar-imovel-url
description: Extrai e audita dados de um anúncio imobiliário, tenta localizar coordenadas confiáveis e cadastra o imóvel na API deste projeto. Use quando o usuário fornecer uma URL de imóvel e pedir para analisar, importar ou cadastrar o anúncio no painel.
---

# Cadastrar imóvel por URL

Importe um anúncio para o painel sem inventar dados.

## Entrada

- Exija uma URL HTTP(S).
- Se a URL for uma página de resultados e o usuário não identificar o imóvel, confirme qual resultado usar. Quando ele disser “primeiro”, registre título e URL individual do primeiro resultado antes de continuar.

## Fluxo obrigatório

1. Abra a URL com as ferramentas de navegador e leia o conteúdo renderizado.
2. Se necessário, inspecione JSON-LD, scripts e mapa incorporado para dados que não aparecem no texto.
3. Extraia os campos descritos em [reference.md](reference.md).
4. Abra `GET /api/properties` e procure duplicatas por URL individual, referência da imobiliária e combinação de descrição/bairro/área. Não cadastre se já existir; informe o ID encontrado.
5. Resolva coordenadas seguindo a ordem de confiança abaixo.
6. Monte o payload, revise inconsistências e envie para `POST /api/properties`.
7. Confirme o cadastro com `GET /api/properties/:id`.
8. Informe ID, imobiliária, bairro, aluguel, área, coordenadas e origem/precisão delas. Quando a LOAD estiver configurada, calcule e informe a distância Haversine.

## Extração e auditoria

- Prefira a URL individual/canônica à URL de pesquisa.
- Use o aluguel mensal, não o preço de venda. Não some condomínio, IPTU ou outros encargos ao aluguel-base; descreva-os em `encargos` ou `observacoes`.
- Use área útil/construída adequada ao espaço oferecido. Registre área de terreno apenas em `observacoes`.
- Preserve referência, descrição relevante, infraestrutura e ressalvas em `observacoes`.
- Use a data atual em `ultimaVerificacao` somente quando o anúncio foi realmente aberto e conferido.
- Use `status: "verificado"` apenas quando preço e dados foram confirmados no anúncio individual. Em página de busca, use `tipoUrl: "busca"` e `status: "link de busca"`.
- Se o anúncio estiver indisponível ou contraditório, não improvise; use `possivelmente expirado` quando houver evidência ou peça orientação.

## Coordenadas

Prioridade:

1. Coordenadas publicadas pelo próprio anúncio, JSON-LD, scripts ou mapa.
2. Endereço exato pesquisado no Google Maps ou OpenStreetMap/Nominatim.
3. Endereço parcial que identifique inequivocamente o imóvel.

Regras:

- Nunca apresente a sede da imobiliária como coordenada do imóvel.
- Valide latitude entre -90 e 90 e longitude entre -180 e 180.
- Confirme que o ponto está em São José do Rio Preto e é compatível com bairro/endereço.
- Se houver apenas o bairro, uma coordenada central do bairro não é coordenada do imóvel. Deixe `latitude` e `longitude` nulas e registre “coordenadas não localizadas; anúncio informa apenas o bairro”.
- Se fontes confiáveis discordarem, não cadastre coordenadas até esclarecer.
- Registre em `observacoes` a fonte e a precisão: anúncio, endereço exato geocodificado ou não localizada.

## Proximidade

- Se houver coordenadas do imóvel e da LOAD via `GET /api/config`, calcule Haversine.
- A classificação aproximada é obrigatória na API, mas não há faixas oficiais. Reutilize uma classificação declarada na fonte/base quando existir.
- Se for um novo imóvel sem classificação, use esta convenção operacional e registre em `observacoes` que ela foi derivada em linha reta:
  - até 1,5 km: `muito_proximo`
  - acima de 1,5 até 4 km: `proximo`
  - acima de 4 até 8 km: `intermediario`
  - acima de 8 km: `mais_distante`
- Sem coordenadas suficientes, estime apenas pelo bairro quando a relação for inequívoca; caso contrário, peça ao usuário a classificação.

## Cadastro

- Use a API do aplicativo, não edite SQLite diretamente.
- Prefira `http://localhost:3001`. Se indisponível, verifique se o usuário roda Docker ou desenvolvimento local; não inicie outra instância que conflite com a porta.
- Não faça o POST até reunir os campos obrigatórios e concluir a verificação de duplicidade.
- Envie JSON segundo [reference.md](reference.md).
- Trate erros `{ error, fields }`, corrija somente com evidência e tente uma vez novamente.
- Esta skill autoriza o cadastro apenas quando o usuário pedir para importar/cadastrar; pedidos de consulta ou confirmação de dados são somente leitura.

## Resultado

Responda de forma curta:

```text
Cadastrado como ID <id>:
- <imobiliária> — <descrição>
- Bairro: <bairro>
- Aluguel: <valor>
- Área: <área>
- Coordenadas: <lat, lng | não localizadas> (<origem/precisão>)
- Distância da LOAD: <km em linha reta | indisponível>
```
