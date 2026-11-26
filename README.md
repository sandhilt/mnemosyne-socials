# mnemosyne-socials

Gerenciador de links sociais: guarda em SQLite o que queremos ver, o que já vimos e quando.

Requer Node 26. O `flake.nix` fornece o Node e o Corepack: rode `direnv allow` uma vez, ou `nix develop`.

```sh
corepack npm install
node --run check
node --run start   # demonstração com dados de exemplo
```

Contexto, arquitetura e convenções estão no [AGENTS.md](AGENTS.md).