import { cp, mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildTemplateAssets } from "./typst-assets.mjs";

const root = process.cwd();
const output = path.join(root, "public", "typst");

await mkdir(output, { recursive: true });
await cp(path.join(root, "typst", "adapters"), path.join(output, "adapters"), { recursive: true, force: true });
await cp(path.join(root, "typst", "fonts"), path.join(output, "fonts"), { recursive: true, force: true });
await cp(path.join(root, "typst", "packages", "preview"), path.join(output, "packages", "preview"), { recursive: true, force: true });
await copyFile(
  path.join(root, "node_modules", "@myriaddreamin", "typst-ts-web-compiler", "pkg", "typst_ts_web_compiler_bg.wasm"),
  path.join(output, "typst_ts_web_compiler_bg.wasm"),
);

const templates = await buildTemplateAssets(root);
await writeFile(path.join(output, "assets.json"), JSON.stringify({ templates }));
