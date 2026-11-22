import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const fontDirectories = {
  academicv: [],
  altacv: ["fontawesome", "lato"],
  "cobalt-cv": ["fontawesome", "notosans", "notoserif"],
  "modern-cv": ["fontawesome", "roboto", "sourcesans3"],
  "neat-cv": ["firasans", "fontawesome", "notosans", "roboto"],
  "rasko-europass": ["opensans"],
  "readable-classic": [],
  "toy-cv": ["toy-fontawesome", "toy-inter"],
  "typographic-resume": ["librebaskerville", "montserrat", "roboto"],
  "vivid-cv": ["fontawesome", "notosans"],
};

async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(file));
    else files.push(file);
  }
  return files;
}

function packageReferences(source) {
  const references = [];
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*\/\//.test(line)) continue;
    for (const match of line.matchAll(/@preview\/([a-z0-9-]+):([0-9.]+)/g)) {
      references.push(`packages/preview/${match[1]}/${match[2]}`);
    }
  }
  return references;
}

function localReferences(source) {
  const references = [];
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*\/\//.test(line)) continue;
    for (const match of line.matchAll(/#(?:import|include)\s+"([^"]+)"/g)) {
      if (!match[1].startsWith("@preview/")) references.push(match[1]);
    }
  }
  return references;
}

export async function buildTemplateAssets(root) {
  const packageDirectory = path.join(root, "typst", "packages", "preview");
  const fontDirectory = path.join(root, "typst", "fonts");
  const adaptersDirectory = path.join(root, "typst", "adapters");
  const allPackageFiles = (await filesUnder(packageDirectory))
    .map((file) => `packages/preview/${path.relative(packageDirectory, file).split(path.sep).join("/")}`);
  const packageFilesByRoot = new Map();
  for (const file of allPackageFiles) {
    const parts = file.split("/");
    const packageRoot = parts.slice(0, 4).join("/");
    const files = packageFilesByRoot.get(packageRoot) ?? [];
    files.push(file);
    packageFilesByRoot.set(packageRoot, files);
  }

  const adapters = (await readdir(adaptersDirectory))
    .filter((file) => file.endsWith(".typ"))
    .sort();
  const templates = {};
  for (const adapterName of adapters) {
    const template = path.basename(adapterName, ".typ");
    const directories = fontDirectories[template];
    if (!directories) throw new Error(`No bundled font mapping for template ${template}.`);

    const packageRoots = new Set();
    const scannedModules = new Set();
    const packageQueue = packageReferences(await readFile(path.join(adaptersDirectory, adapterName), "utf8"));
    const moduleQueue = [];
    while (packageQueue.length || moduleQueue.length) {
      while (packageQueue.length) {
        const packageRoot = packageQueue.shift();
        if (packageRoots.has(packageRoot)) continue;
        const files = packageFilesByRoot.get(packageRoot);
        if (!files) throw new Error(`Missing Typst package assets for ${template}: ${packageRoot}.`);
        packageRoots.add(packageRoot);
        const packagePath = path.join(packageDirectory, ...packageRoot.split("/").slice(2));
        const metadata = await readFile(path.join(packagePath, "typst.toml"), "utf8");
        const packageSection = metadata
          .split(/^\[package\][ \t]*\r?\n/m)[1]
          ?.split(/^\[[^\]]+\][ \t]*\r?$/m)[0];
        const entrypoint = packageSection?.match(/^\s*entrypoint\s*=\s*"([^"]+)"/m)?.[1];
        if (!entrypoint) throw new Error(`Missing package entrypoint for ${template}: ${packageRoot}.`);
        moduleQueue.push({ packageRoot, file: entrypoint });
      }
      const current = moduleQueue.shift();
      if (!current) continue;
      const key = `${current.packageRoot}/${current.file}`;
      if (scannedModules.has(key)) continue;
      scannedModules.add(key);
      const packagePath = path.join(packageDirectory, ...current.packageRoot.split("/").slice(2));
      const source = await readFile(path.join(packagePath, ...current.file.split("/")), "utf8");
      packageQueue.push(...packageReferences(source));
      for (const reference of localReferences(source)) {
        const file = path.posix.normalize(path.posix.join(path.posix.dirname(current.file), reference));
        if (file === ".." || file.startsWith("../")) {
          throw new Error(`Package import escapes its root for ${template}: ${key}.`);
        }
        moduleQueue.push({ packageRoot: current.packageRoot, file });
      }
    }

    const fontFiles = [];
    for (const directory of directories) {
      const files = await filesUnder(path.join(fontDirectory, directory));
      fontFiles.push(...files
        .filter((file) => /\.(?:ttf|otf)$/i.test(file))
        .map((file) => `fonts/${path.relative(fontDirectory, file).split(path.sep).join("/")}`));
    }

    templates[template] = {
      packageRoots: [...packageRoots].sort(),
      packageFiles: [...packageRoots].flatMap((packageRoot) => packageFilesByRoot.get(packageRoot) ?? []).sort(),
      fontFiles: fontFiles.sort(),
    };
  }
  return templates;
}
