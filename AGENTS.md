# AGENTS.md

Fonte única das instruções do projeto, para pessoas e para agentes. Não crie arquivos de instrução específicos de uma ferramenta nem cite ferramentas de agente no repositório.

## Produto

Gerenciador de links sociais. Duas pessoas trocam muitos reels e vídeos por WhatsApp, TikTok, Messenger, Instagram e outros. Os links se perdem, ninguém sabe o que o outro já viu e o mesmo vídeo é enviado mais de uma vez.

O projeto recebe esses links e guarda em SQLite o que cada pessoa quer ver, o que já viu e quando viu.

Estado atual: só a casca. Não há funcionalidade de links, tabela nem migração.

### Vocabulário proposto

Revise antes de implementar. Nada disto existe no código ainda.

- **Link**: um conteúdo único, identificado pela URL normalizada.
- **Envio**: o ato de uma pessoa mandar um link a outra, com data e canal. Um link pode ter vários envios.
- **Visualização**: o registro de que uma pessoa viu um link, com data. É por pessoa.
- **Pendente**: link enviado a alguém que ainda não tem visualização dessa pessoa.

### Decisões em aberto

Pergunte antes de escolher.

- Como os links chegam (CLI, API HTTP, bot, compartilhamento pelo celular). Confirme o que cada plataforma permite antes de prometer integração.
- Como reconhecer o mesmo vídeo com URLs diferentes (parâmetros de rastreio, links curtos).
- Como identificar cada pessoa.
- Se reações e comentários entram no primeiro escopo.
- Como versionar o esquema do banco.

## Comandos

```sh
direnv allow           # uma vez: carrega Node 26 e Corepack pelo flake (ou: nix develop)
corepack npm install
node --run start
node --run dev            # reinicia a cada mudança
node --run test
node --run test:coverage  # cobertura ainda é experimental no Node
node --run typecheck
node --run check          # typecheck + testes, obrigatório antes de commit
```

## Stack

- Node no LTS mais atual. Hoje é o 26. O Node executa o TypeScript direto (type stripping), sem build.
- Scripts rodam com `node --run <script>`, não com `npm run`. O `node --run` não executa scripts `pre` e `post`.
- O npm só instala dependências, sempre pelo Corepack (`corepack npm install`), na versão fixada em `packageManager`.
- ESM e ECMAScript moderno (`using`, `Temporal`, métodos novos da linguagem). Use `Temporal` para datas, não `Date`.
- SQLite pelo módulo `node:sqlite`, que no Node 26 está em "release candidate".
- Testes com `node:test` e `node:assert/strict`.
- Biblioteca padrão primeiro. Não há dependência de runtime. As de desenvolvimento são `typescript` e `@types/node`. Uma dependência nova precisa de motivo: o que a std não faz.

Configuração vem do ambiente. `node --run start` e `node --run dev` carregam o `.env` se ele existir (modelo em `.env.example`). Com o direnv ativo, o Node certo já está no `PATH`. Fora dele, `engines` só gera um aviso na instalação e o `node --run` não confere a versão. O Node 26 não traz o Corepack: o `flake.nix` o fornece, compilado sobre o Node 26. Para atualizar o npm, rode `corepack use npm@<versão>`.

Quando sair um novo LTS, atualize juntos `engines` no `package.json`, `@types/node`, `packageManager`, `flake.nix` (e `nix flake update`) e esta seção.

## Arquitetura

Clean Architecture. As dependências apontam para dentro.

| Camada | Conteúdo | Pode importar |
| --- | --- | --- |
| `src/domain` | Entidades, value objects, regras puras | `domain` |
| `src/application` | Casos de uso e portas (interfaces) | `application`, `domain` |
| `src/infrastructure` | Adapters: SQLite, configuração, entrada e saída | qualquer camada e `node:*` |
| `src/main.ts` | Composition root | tudo |

`test/architecture.test.ts` quebra o build quando um import viola essa tabela.

Padrões em uso:

- **Repository**: a porta fica em `application`, o adapter SQLite em `infrastructure`.
- **Adapter**: cada rede social ou canal de entrada é um adapter.
- **Injeção de dependência**: por argumento de função ou construtor, montada em `main.ts`. Sem container.
- **Strategy** ou **Chain of Responsibility**: para regras que variam por plataforma. Quando duas regras conflitam numa lista ordenada, vale a primeira.

Valide dados externos na borda (CLI, ambiente, rede, banco). Dentro do sistema, confie nos tipos.

## Convenções de código

- Identificadores em inglês. Documentação em português.
- Imports com extensão `.ts`. Entre camadas, use os aliases `#domain/`, `#application/` e `#infrastructure/`.
- Só sintaxe TypeScript que pode ser apagada: nada de `enum`, `namespace` com valor, parameter properties ou decorators. Use `import type` para tipos.
- O Node não verifica tipos. Quem verifica é o `node --run typecheck`.
- Funções pequenas, nomes que dizem a intenção. Comentário só para um porquê que o código não mostra.
- Lógica nova vem com teste ao lado do arquivo (`*.test.ts`). Teste comportamento observável, não implementação. Use banco `:memory:` ou diretório temporário.
- SQL sempre com parâmetros (`prepare`), nunca por concatenação.

## Git

- Sem pull requests. O trabalho vai direto para a `main`.
- Agentes fazem commit e push quando a pessoa pedir.
- Rode `node --run check` antes. Não há CI, então essa é a única verificação.
- Commits em inglês, no formato Conventional Commits.
- Nunca commite `.env`, bancos SQLite ou links reais trocados entre pessoas.
- Não inclua link de sessão de ferramenta de IA no commit.
