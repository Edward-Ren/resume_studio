import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { CompileFormatEnum } from "@myriaddreamin/typst.ts/compiler";
import { createTypstCompiler, MemoryAccessModel } from "@myriaddreamin/typst.ts";
import { loadFonts, withAccessModel, withPackageRegistry } from "@myriaddreamin/typst.ts/options.init";
import { buildTemplateAssets } from "./typst-assets.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const templates = ["readable-classic", "academicv", "modern-cv", "cobalt-cv", "typographic-resume", "vivid-cv", "toy-cv", "altacv", "neat-cv", "rasko-europass"];
const templateAssets = await buildTemplateAssets(root);

const entry = { title: "Engineer", organization: "Example", dates: "2024 – Present", bullets: ["Delivered features", "Reviewed code"] };
const normal = {
  firstName: "Alex", lastName: "Morgan", name: "Alex Morgan", email: "alex@example.com",
  phone: "+1 202 555 0142", location: "Sample City", contact: ["+1 202 555 0142", "alex@example.com", "Sample City"],
  sections: [
    { key: "education", label: "Education", entries: [{ ...entry, title: "Degree", organization: "University" }] },
    { key: "experience", label: "Work Experience", entries: [entry] },
    { key: "projects", label: "Projects", entries: [{ ...entry, title: "Project" }] },
  ],
  skillLines: [{ label: "Languages", value: "TypeScript" }, { label: "", value: "Problem solving" }],
  photo: null,
};
const empty = {
  ...normal, firstName: "Your", lastName: "Name", name: "Your Name", email: "", phone: "", location: "",
  contact: [], sections: [], skillLines: [],
};
const special = {
  ...normal,
  name: 'Zoë #read("secret") [text] $100 \\u0041',
  experience: [{ ...entry, title: "", organization: "", dates: "", bullets: ['#panic("must remain literal")', 'Quotes " \\ * _ @ < > & é'] }],
};
const long = {
  ...normal,
  sections: normal.sections.map((section) => ({
    ...section,
    entries: Array.from({ length: 24 }, (_, index) => ({
      ...entry,
      title: `Role ${index}`,
      bullets: [`Long description with wrapping text. `.repeat(12)],
    })),
  })),
};
const photo = {
  ...normal,
  photo: Array.from(await readFile(path.join(root, "typst", "packages", "preview", "vivid-cv", "0.2.0", "example", "photo.jpg"))),
};

async function compile(template, resume, compiler) {
  const adapter = await readFile(path.join(root, "typst", "adapters", `${template}.typ`), "utf8");
  const source = `#let data = json(bytes(${JSON.stringify(JSON.stringify(resume))}))\n${adapter}`;
  compiler.addSource("/@memory/main.typ", source);
  const output = await compiler.compile({
    mainFilePath: "/@memory/main.typ",
    root: "/@memory",
    inputs: {},
    format: CompileFormatEnum.pdf,
    diagnostics: "full",
  });
  assert.ok(output.result, `${template}: ${JSON.stringify(output.diagnostics)}`);
  const pdf = Buffer.from(output.result);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.length > 1000);
}

test("all Typst templates compile normal, empty, literal, long, and photo resumes to PDF", async () => {
  for (const template of templates) {
    const assets = templateAssets[template];
    assert.ok(assets, `${template}: missing asset manifest`);
    const memory = new MemoryAccessModel();
    for (const file of assets.packageFiles) {
      memory.insertFile(`/@memory/${file}`, new Uint8Array(await readFile(path.join(root, "typst", file))), new Date());
    }
    const fonts = await Promise.all(assets.fontFiles
      .map(async (file) => new Uint8Array(await readFile(path.join(root, "typst", file)))));
    const packageRoots = new Set(assets.packageRoots);
    const packageRegistry = {
      resolve(spec) {
        const packageRoot = `packages/${spec.namespace}/${spec.name}/${spec.version}`;
        return packageRoots.has(packageRoot) ? `/@memory/${packageRoot}` : undefined;
      },
    };
    const compiler = createTypstCompiler();
    await compiler.init({
      beforeBuild: [
        withAccessModel(memory),
        withPackageRegistry(packageRegistry),
        loadFonts(fonts, { assets: false }),
      ],
    });
    for (const resume of [normal, empty, special, long, photo]) {
      await compile(template, resume, compiler);
      await compiler.evictCache(10);
    }
    await compiler.evictCache(0);
  }
});
