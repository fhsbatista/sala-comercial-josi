# Painel de Salões Comerciais — São José do Rio Preto

Painel web para pesquisa, filtragem e comparação de salões comerciais (a partir de 40 m²) em São José do Rio Preto – SP, com foco na proximidade da **LOAD Facility** (Rua Antônio de Godoy, 51-91, Nova Redentora).

> **Aviso:** a base de dados é uma fotografia da pesquisa realizada em **16/09/2026**. Disponibilidade, preços e links podem ter mudado desde então.

## Stack

- [React](https://react.dev/) 19
- [Vite](https://vite.dev/) 7
- Dados estáticos em `src/data/imoveis.js` (sem backend)

## Funcionalidades

- Tabela (desktop) e cards (mobile) com 28 imóveis
- Busca textual (sem diferenciar acentos)
- Filtros por imobiliária, bairro, aluguel, área e status
- Ordenação por proximidade da LOAD, preço, área e preço/m²
- Modal de detalhes por imóvel
- Botão "Verificar anúncio" (abre URL em nova aba)
- Painel de integridade dos dados
- Classificação aproximada de proximidade (🟢 🟡 🟠 🔴), preparada para distância real futura

## Instalação e execução local

```bash
npm install
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) no navegador.

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Valida dados + build de produção |
| `npm run preview` | Preview do build local |
| `npm run validate:data` | Valida integridade dos 28 registros |
| `npm run lint` | ESLint |

## Estrutura de dados

Cada imóvel em `src/data/imoveis.js` possui:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | number | Identificador único (1–28) |
| `imobiliaria` | string | Nome da imobiliária |
| `descricao` | string | Descrição do imóvel |
| `bairro` | string | Bairro |
| `endereco` | string | Endereço ou localização |
| `areaM2` | number | Área em m² |
| `aluguel` | number | Valor do aluguel (R$) |
| `encargos` | string\|null | Ex: "+ IPTU" |
| `proximidade` | string | `muito_proximo`, `proximo`, `intermediario`, `mais_distante` |
| `distanciaKm` | number\|null | Reservado para distância real futura |
| `coordenadas` | object\|null | Reservado para lat/lng futuro |
| `url` | string | Link do anúncio ou busca |
| `tipoUrl` | string | `individual` ou `busca` |
| `status` | string | `verificado`, `não verificado`, `link de busca`, `possivelmente expirado` |
| `ultimaVerificacao` | string\|null | Data da última verificação |
| `observacoes` | string\|null | Notas adicionais |

### Adicionar ou corrigir imóveis

1. Edite `src/data/imoveis.js`
2. Execute `npm run validate:data` para verificar integridade
3. Faça commit e push

A validação garante: 28 registros, IDs únicos, campos obrigatórios, área mínima de 40 m², consistência entre `tipoUrl` e `status`.

## Publicação no GitHub Pages

O projeto está configurado para deploy automático via GitHub Actions.

### Pré-requisitos

1. Repositório no GitHub com nome `sala-comercial-josi`
2. Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions**

### Deploy automático

A cada push na branch `main`, o workflow `.github/workflows/deploy.yml`:

1. Instala dependências (`npm ci`)
2. Valida a base de dados
3. Faz o build (`vite build`)
4. Publica em `https://<usuario>.github.io/sala-comercial-josi/`

### Base path

O `base` do Vite está configurado como `/sala-comercial-josi/` em `vite.config.js`. Se renomear o repositório, atualize esse valor.

## Extensibilidade futura

A estrutura permite adicionar posteriormente:

- Distância exata em km (`distanciaKm`)
- Coordenadas e mapa (`coordenadas`)
- Verificação automática de anúncios
- Histórico de preços
- Favoritos e comparação side-by-side
- Notas pessoais por imóvel
