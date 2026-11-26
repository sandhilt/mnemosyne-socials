# Harnesses de agentes

A fonte única é o [AGENTS.md](../AGENTS.md) na raiz. Não copie regras para arquivos específicos de uma ferramenta.

Situação conforme a documentação oficial consultada em 2026-11-26. Neste repositório, só Claude Code 2.1.331 e Codex CLI 0.171.0 foram testados: os dois citaram a seção "Git" sem ler arquivos. As outras linhas vêm apenas da documentação.

| Harness | Lê `AGENTS.md` | O que o repositório faz | Cuidado |
| --- | --- | --- | --- |
| [Claude Code](https://code.claude.com/docs/en/memory) | Sim, a partir da 2.1.277 (2.1.281 em algumas instalações) | Nada | Um `CLAUDE.md` ou `CLAUDE.local.md` no projeto faz ele ignorar o `AGENTS.md` por padrão |
| [Codex CLI](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | Sim | Nada | `AGENTS.override.md` tem prioridade. Limite de 32 KiB somados |
| [Cursor](https://cursor.com/docs/context/rules) | Sim | Nada | |
| [GitHub Copilot](https://docs.github.com/en/copilot/reference/custom-instructions-support) | Sim | Nada | No VS Code, `AGENTS.md` em subpastas depende de configuração |
| [Gemini CLI](https://geminicli.com/docs/reference/configuration/) | Não por padrão | `.gemini/settings.json` | Ignorado em pasta não confiável |
| [Antigravity](https://antigravity.google/docs/rules) | Sim | Nada | Trunca arquivo de regra acima de 24.000 bytes |
| [Grok Build](https://docs.x.ai/build/features/project-rules) | Sim | Nada | |
| [Devin Desktop / Windsurf](https://docs.devin.ai/desktop/cascade/agents-md) | Sim | Nada | |
| [Zed](https://zed.dev/docs/ai/instructions) | Sim | Nada | Usa só o primeiro arquivo que achar. `.rules`, `.cursorrules` e similares escondem o `AGENTS.md` |
| [Aider](https://aider.chat/docs/config/aider_conf.html) | Não | `.aider.conf.yml` | |
| [OpenCode](https://opencode.ai/docs/rules/) | Sim | Nada | |
| [JetBrains Junie](https://junie.jetbrains.com/docs/guidelines-and-memory.html) | Sim | Nada | `.junie/AGENTS.md` substitui o da raiz. Não crie |

## Ao entrar com um harness novo

1. Veja se ele lê `AGENTS.md` sozinho.
2. Se não ler, adicione o menor arquivo que aponte para o `AGENTS.md` e inclua uma linha na tabela.
3. Peça ao agente para citar a seção "Git" do `AGENTS.md`. Isso confirma que as instruções carregaram.
