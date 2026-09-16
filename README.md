# Painel de Salões Comerciais — São José do Rio Preto

Aplicação full-stack para pesquisa, cadastro e comparação de salões comerciais (a partir de 40 m²) em São José do Rio Preto – SP, com foco na proximidade da **LOAD Facility**.

> **Aviso:** a base inicial é uma fotografia da pesquisa realizada em **16/09/2026**. Disponibilidade, preços e links podem ter mudado. Novos imóveis podem ser cadastrados e persistidos no SQLite.

## Stack

- **Frontend:** React 19 + Vite + React Router + Leaflet
- **Backend:** Node.js + Express
- **Banco:** SQLite (`better-sqlite3`)

## Funcionalidades

- Listagem com busca, filtros e ordenação
- Cadastro público de imóveis (sem autenticação nesta versão)
- Coordenadas opcionais por imóvel
- Página de detalhes com mapa OpenStreetMap e distância em linha reta da LOAD
- Seed idempotente com os 28 registros originais preservados
- API REST: `GET/POST /api/properties`, `GET /api/config`

## Requisitos

- Node.js 22+
- npm

## Instalação

```bash
cp .env.example .env
npm install
npm run db:setup
```

Configure manualmente as coordenadas da LOAD Facility no `.env` (necessárias para mapa e distância):

```env
LOAD_LATITUDE=
LOAD_LONGITUDE=
```

## Desenvolvimento

**Não rode `npm run dev` e `docker compose up` ao mesmo tempo** — ambos usam a porta 3001.

```bash
docker compose down   # se o Docker estiver ativo
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001 (proxy automático via Vite)

Se aparecer `EADDRINUSE` na porta 3001, o Docker (ou outro processo) ainda está ocupando a porta.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Frontend + API em paralelo |
| `npm run build` | Build do frontend |
| `npm start` | Servidor de produção (serve API + dist) |
| `npm run db:migrate` | Executa migrações |
| `npm run db:setup` | Executa migrações (banco inicia vazio) |
| `npm test` | Testes automatizados |
| `npm run lint` | ESLint |

## Rotas do frontend

| Rota | Descrição |
|------|-----------|
| `/` | Painel com listagem, filtros e integridade |
| `/imoveis/novo` | Formulário de cadastro |
| `/imoveis/:id` | Detalhes com mapa e distância |

## API

### `GET /api/properties`
Lista todos os imóveis.

### `GET /api/properties/:id`
Detalhes de um imóvel.

### `POST /api/properties`
Cadastra novo imóvel. Campos principais: `imobiliaria`, `descricao`, `bairro`, `endereco`, `areaM2`, `aluguel`, `proximidade`, `url`, `tipoUrl`, `latitude`, `longitude` (opcionais, devem ser informados juntos).

### `GET /api/config`
Retorna metadados públicos e coordenadas da LOAD (se configuradas).

## Cadastro público

Nesta versão **não há autenticação**. Qualquer visitante com acesso ao site pode cadastrar imóveis. Endpoints de edição/exclusão não estão expostos.

## Mapa e distância

- Mapa exibido na página de detalhes quando **imóvel e LOAD** possuem coordenadas válidas
- Distância calculada por **Haversine** (linha reta), não rota viária
- Sem coordenadas, a classificação aproximada (Muito próximo / Próximo / etc.) continua sendo exibida

## Docker (produção)

```bash
# Configure LOAD_LATITUDE e LOAD_LONGITUDE no .env ou docker-compose
docker compose up --build
```

Acesse http://localhost:3001

O banco fica em **`./data/imoveis.sqlite`** no projeto (montado em `/data` no container). Você pode editá-lo diretamente com DB Browser ou `sqlite3`; reinicie o container e recarregue a página após alterações manuais.

Se você usava o volume Docker antigo (`imoveis_data`) e quer migrar os dados:

```bash
docker compose cp app:/data/imoveis.sqlite ./data/imoveis.sqlite
docker compose down
docker compose up -d
```

## Hospedagem

Esta aplicação **não funciona no GitHub Pages** (requer servidor Node.js e disco persistente).

Recomendações:
- VPS ou servidor com volume persistente
- Docker com volume montado
- Backup periódico do arquivo `.sqlite`

Serviços com filesystem efêmero perdem o banco a cada redeploy.

## Estrutura

```
server/           API Express + SQLite
  migrations/     Schema SQL versionado
src/
  pages/          Dashboard, cadastro, detalhes
  components/     Tabela, cards, formulário, mapa
  api/            Cliente HTTP
  data/imoveis.js Metadados públicos (referência LOAD)
```

## Manutenção da base

1. Imóveis: cadastrar pela interface ou `POST /api/properties`
2. Banco versionado: `data/imoveis.sqlite` (copie ou restaure em novos ambientes)

## Histórico

- **v1:** painel estático (commit `fa830f4`)
- **v2:** SQLite + cadastro + mapas (versão atual)
