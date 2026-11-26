# Reenvios

Serve para saber o que já foi mandado antes e acabar com a dúvida do "eu te mandei esse".

## Regra

Um link é um conteúdo único, reconhecido pela chave derivada da URL. O primeiro envio dele é o original. Todo envio seguinte do mesmo link é um reenvio, em qualquer direção e por qualquer canal.

"Primeiro" significa a data de envio mais antiga. Em caso de empate, vale a ordem de canal e id da mensagem. A ordem de importação não muda o resultado.

Cada reenvio traz:

| Campo | Significado |
| --- | --- |
| `share` | O envio repetido |
| `original` | O envio mais antigo do mesmo link |
| `seenAt` | Quando quem recebeu viu o link pela primeira vez, antes ou depois do reenvio. Vazio se nunca viu |

Um reenvio não reabre a pendência de quem já viu o link.

## Exemplo

1. Segunda: uma pessoa envia um reel. A outra o vê no mesmo dia.
2. Sexta: o mesmo reel é enviado de novo.

O envio de sexta aparece como reenvio, com `original` na segunda e `seenAt` na segunda. Ele não volta para os pendentes.

Se o vídeo só for visto no sábado, o mesmo reenvio passa a mostrar `seenAt` no sábado. Comparar `seenAt` com a data do envio diz se foi visto antes ou depois.

## No código

- `resendsOf(link)`, em `src/domain/link.ts`, aplica a regra.
- `list-resends`, em `src/application/use-cases/`, lista os reenvios de todos os links, do mais antigo ao mais recente.
- `node --run start` mostra a lista com os dados de exemplo.

## Armazenamento

Nada é gravado à parte: os reenvios são calculados a partir dos envios. No SQLite, que ainda não existe, eles serão uma view chamada `resends` sobre a tabela de envios.

O motivo é que importar um envio mais antigo muda qual é o original, e uma tabela copiada precisaria ser corrigida. Uma tabela própria só se justifica para guardar uma informação que não dá para calcular.

## Limite

A repetição só é reconhecida quando as URLs geram a mesma chave. O mesmo vídeo publicado em plataformas diferentes, ou enviado por um link curto, aparece como dois links.
