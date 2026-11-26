# Domínio

O círculo central da Clean Architecture. Cada conceito tem um arquivo direto nesta pasta, com o tipo `Readonly` e as funções puras que guardam suas regras. Classe só quando houver motivo (hoje, o erro `InvalidShareError`). O domínio só importa módulos do próprio domínio.

O domínio não sabe quem o usa. Os casos de uso e a porta Repository ficam na aplicação, e a infraestrutura implementa as portas por meio de adaptadores. O ponto de composição em `src/main.ts` injeta as dependências.
