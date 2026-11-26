# AGENTS.md

Fonte única das instruções do projeto, para pessoas e para agentes. Não crie arquivos de instrução específicos de uma ferramenta nem cite ferramentas de agente no repositório.

## Produto

Gerenciador de links sociais. Duas pessoas trocam muitos reels e vídeos por WhatsApp, TikTok, Messenger, Instagram e outros. Os links se perdem, ninguém sabe o que o outro já viu e o mesmo vídeo é enviado mais de uma vez.

O projeto recebe esses links e guarda em SQLite o que cada pessoa quer ver, o que já viu e quando viu.

Estado atual: entidades e casos de uso funcionam sobre adapters de mentira (repositório em memória e fonte de exemplo). `node --run start` roda uma demonstração. Ainda não há repositório SQLite, tabela, migração nem entrada real de links.

### Vocabulário

- **Link**: um conteúdo único, identificado por uma chave derivada da URL. Guarda os envios e as visualizações.
- **Pessoa**: quem envia, recebe e vê. No código é o id `PersonId`.
- **Envio** (`Share`): uma pessoa manda um link a outra, com data, canal e id da mensagem. O par canal e id da mensagem não se repete dentro de um link.
- **Reenvio** (`Resend`): qualquer envio do mesmo link após o primeiro na ordem de data, canal e id da mensagem. Mostra se e quando quem recebeu viu o link, em qualquer momento.
- **Visualização** (`View`): quando uma pessoa viu um link. Vale a mais antiga.
- **Pendente**: link enviado a uma pessoa que ainda não o viu. Aparece uma vez, mesmo com vários envios. Um reenvio não reabre a pendência de quem já viu o link.

### Casos de uso

Um arquivo por caso de uso em `src/application/use-cases/`: `register-share`, `mark-viewed`, `list-pending`, `list-resends`, `get-link-history` e `import-shares`. As portas estão em `src/application/ports.ts`.

### Decisões em aberto

Pergunte antes de escolher.

- Como os links chegam (entrada própria, MCP ou outra). Será um adapter de `ShareSource` ou um chamador de `register-share`. Confirme o que cada plataforma permite antes de prometer integração.
- Se enviar um link conta como já ter visto. Hoje não conta.
- Links curtos (`vm.tiktok.com` e similares) não são resolvidos, então não se juntam ao link completo.
- Mudar uma regra de identidade com dados já gravados exigirá recalcular as chaves.
- Como identificar cada pessoa.
- O que fazer quando uma origem entrega um id de pessoa em branco. Hoje o erro interrompe a importação.
- Se reações e comentários entram no escopo.
- Como versionar o esquema do banco.
- Se o mesmo vídeo publicado em URLs ou plataformas diferentes poderá ser marcado como possível repetição. Hoje esse caso não é detectado.

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
| `src/domain` | Entidades como tipos `Readonly`, regras puras e erros do domínio | `domain` |
| `src/application` | Casos de uso e portas (interfaces) | `application`, `domain` |
| `src/infrastructure` | Adapters: SQLite, configuração, entrada e saída | qualquer camada e `node:*` |
| `src/main.ts` | Composition root | tudo |

`test/architecture.test.ts` quebra o build quando um import viola essa tabela.

Padrões em uso:

- **Entidades**: um arquivo por conceito, direto em `src/domain/` (`person`, `share`, `view`, `link`), sem subpastas. Cada um tem o tipo `Readonly` e as funções puras com suas regras. Não conhecem casos de uso, portas nem I/O.
- **Criação validada**: monte valores com `personId` e `createShare`, nunca com um objeto literal em código de produção. O tipo aberto não impede o atalho.
- **Classe só com motivo**: use quando a linguagem exigir ou quando proteger um estado compensar. Hoje a única é `InvalidShareError`, por causa do `instanceof`.
- **Aggregate**: `Link` reúne envios e visualizações. As funções devolvem um novo valor.
- **Casos de uso**: funções-fábrica que recebem as portas, montam os valores do domínio a partir de dados simples e orquestram.
- **Repository**: a porta `LinkRepository` fica em `application`. O adapter atual é em memória; o de SQLite vem depois.
- **Dados derivados**: reenvios são calculados a partir dos envios. No SQLite serão uma view, não uma tabela copiada ([docs/reenvios.md](docs/reenvios.md)).
- **Adapter**: `ShareSource` é a porta de entrada. Cada origem de links é um adapter. Hoje só existe o mock.
- **Injeção de dependência**: por argumento de função ou construtor, montada em `main.ts`. Sem container.
- **Chain of Responsibility**: as regras de identidade por plataforma em `src/domain/link-key.ts`. Vale a primeira que responder; para mudar a prioridade, mude a ordem.

Valide dados externos na borda (CLI, ambiente, rede, banco). Dentro do sistema, confie nos tipos.

## Documentação

Documente em `docs/`, em português. Toda mudança de comportamento, regra de domínio ou decisão de projeto cria ou atualiza um arquivo ali, na mesma mudança do código. Um arquivo por assunto, listado em `docs/README.md`. O `AGENTS.md` guarda as instruções de trabalho; a explicação detalhada fica em `docs/`.

## Convenções de código

- Identificadores em inglês. Documentação em português.
- Imports com extensão `.ts`. Entre camadas, use os aliases `#domain/`, `#application/` e `#infrastructure/`.
- Só sintaxe TypeScript que pode ser apagada: nada de `enum`, `namespace` com valor, parameter properties ou decorators. Use `import type` para tipos.
- O Node não verifica tipos. Quem verifica é o `node --run typecheck`.
- Funções pequenas, nomes que dizem a intenção. Comentário só para um porquê que o código não mostra.
- Lógica nova vem com teste ao lado do arquivo (`*.test.ts`). Teste de caso de uso que usa um adapter fica em `test/`. Teste comportamento observável, não implementação. Use banco `:memory:` ou diretório temporário.
- SQL sempre com parâmetros (`prepare`), nunca por concatenação.

## Git

- Sem pull requests. O trabalho vai direto para a `main`.
- Agentes fazem commit e push quando a pessoa pedir.
- Rode `node --run check` antes. Não há CI, então essa é a única verificação.
- Commits em inglês, no formato Conventional Commits.
- Nunca commite `.env`, bancos SQLite ou links reais trocados entre pessoas.
- Não inclua link de sessão de ferramenta de IA no commit.
