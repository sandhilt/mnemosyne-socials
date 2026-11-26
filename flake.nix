{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { nixpkgs, ... }: {
    devShells = nixpkgs.lib.genAttrs [
      "x86_64-linux"
      "aarch64-linux"
      "aarch64-darwin"
    ] (system:
      let pkgs = nixpkgs.legacyPackages.${system};
      in {
        default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_26
            # The nixpkgs corepack runs on the default Node, older than this project requires.
            (pkgs.corepack.override { nodejs-slim = pkgs.nodejs-slim_26; })
          ];
        };
      });
  };
}
