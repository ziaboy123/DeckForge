// Lets `node --test` run the TypeScript sources directly (Node strips the types itself): resolves the "@/..." path
// alias from tsconfig.json to src/, and finds .ts files for imports written without an extension.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = new URL("../src/", import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    let url = null;
    if (specifier.startsWith("@/")) url = new URL(specifier.slice(2), SRC);
    else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) url = new URL(specifier, context.parentURL);
    if (url && !existsSync(fileURLToPath(url))) {
      const found = [".ts", ".tsx", "/index.ts"].map((ext) => new URL(url.href + ext)).find((u) => existsSync(fileURLToPath(u)));
      if (found) url = found;
    }
    return nextResolve(url ? url.href : specifier, context);
  },
});
