# Domínio

Aqui ficam as entidades, os objetos de valor e as regras de negócio. O domínio só importa módulos do próprio domínio.

Os casos de uso e as portas Repository ficam na aplicação. A infraestrutura implementa essas portas por meio de adaptadores. O ponto de composição em `src/main.ts` injeta as dependências via construtor ou argumento de função.
