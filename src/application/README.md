# Aplicação

Aqui ficam os casos de uso e as portas Repository que descrevem as operações de persistência de que eles precisam. A aplicação só importa módulos do domínio e da própria aplicação.

A infraestrutura implementa as portas por meio de adaptadores. O ponto de composição em `src/main.ts` injeta esses adaptadores nos casos de uso via construtor ou argumento de função.
