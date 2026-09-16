# Referência do cadastro

## Endpoint

`POST http://localhost:3001/api/properties`

Cabeçalho:

```text
Content-Type: application/json
```

## Payload

```json
{
  "imobiliaria": "Nome da imobiliária",
  "descricao": "Título objetivo do imóvel",
  "bairro": "Bairro",
  "endereco": "Endereço ou localização declarada",
  "areaM2": 100,
  "aluguel": 2500,
  "encargos": "+ IPTU",
  "url": "https://exemplo.com/anuncio/123",
  "tipoUrl": "individual",
  "status": "verificado",
  "ultimaVerificacao": "DD/MM/AAAA",
  "observacoes": "Referência, características e origem das coordenadas.",
  "latitude": -20.8,
  "longitude": -49.3
}
```

## Restrições

- Obrigatórios: `imobiliaria`, `descricao`, `bairro`, `endereco`, `areaM2`, `aluguel`, `url`, `tipoUrl`.
- `areaM2`: número positivo (maior que zero).
- `aluguel`: número positivo, sem símbolos ou formatação.
- `tipoUrl`: `individual` ou `busca`.
- `status`: `verificado`, `não verificado`, `link de busca` ou `possivelmente expirado`.
- Coordenadas são opcionais, mas latitude e longitude devem ser enviadas juntas.
- Ordem: coords do anúncio → geocodificar endereço exato → centro do bairro (somente se não houver endereço exato).
- Quando houver endereço com logradouro (rua/avenida + número), geocodifique o endereço completo; **não** substitua pelo centro do bairro.
- Quando o anúncio informar só o bairro, geocodifique o centro aproximado do bairro e envie `latitude`/`longitude`.
- Em lote, deduplique endereços exatos e bairros antes de geocodificar (uma consulta por chave distinta).
- Campos opcionais sem valor podem ser `null`.

## Consulta e deduplicação

- Lista: `GET http://localhost:3001/api/properties`
- Detalhes: `GET http://localhost:3001/api/properties/:id`
- Configuração da LOAD: `GET http://localhost:3001/api/config`

Considere duplicata quando:

1. a URL individual normalizada já existir; ou
2. a mesma referência da imobiliária aparecer nas observações; ou
3. imobiliária, bairro, área e descrição identificarem inequivocamente o mesmo imóvel.

URLs de busca compartilhadas não bastam para considerar registros duplicados.
