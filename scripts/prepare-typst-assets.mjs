import { cp, mkdir, readdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";

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

async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(file));
    else files.push(file);
  }
  return files;
}

const packageDirectory = path.join(output, "packages", "preview");
const packageFiles = (await filesUnder(packageDirectory))
  .map((file) => path.relative(output, file).split(path.sep).join("/"));
const packageRoots = [];
for (const name of await readdir(packageDirectory, { withFileTypes: true })) {
  if (!name.isDirectory()) continue;
  const versions = path.join(packageDirectory, name.name);
  for (const version of await readdir(versions, { withFileTypes: true })) {
    if (version.isDirectory()) packageRoots.push(`packages/preview/${name.name}/${version.name}`);
  }
}
const fontFiles = (await filesUnder(path.join(output, "fonts")))
  .filter((file) => /\.(?:ttf|otf)$/i.test(file))
  .map((file) => path.relative(output, file).split(path.sep).join("/"));

await writeFile(path.join(output, "assets.json"), JSON.stringify({ packageRoots, packageFiles, fontFiles }));
