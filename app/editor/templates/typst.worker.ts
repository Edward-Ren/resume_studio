/// <reference lib="webworker" />

import { CompileFormatEnum, createTypstCompiler } from "@myriaddreamin/typst.ts/compiler";
import { MemoryAccessModel } from "@myriaddreamin/typst.ts/fs/memory";
import type { PackageRegistry } from "@myriaddreamin/typst.ts/internal.types";
import { loadFonts, withAccessModel, withPackageRegistry, type BeforeBuildFn } from "@myriaddreamin/typst.ts/options.init";
import { isResumeData, type ResumeData } from "../resume-data";
import { adaptResume } from "./typst-data";

interface AssetManifest {
  templates: Record<string, {
    packageRoots: string[];
    packageFiles: string[];
    fontFiles: string[];
  }>;
}

interface RenderRequest {
  type: "render";
  clientId: string;
  id: number;
  template: string;
  resume: ResumeData;
}

interface CancelRequest {
  type: "cancel";
  clientId: string;
  id: number;
}

type WorkerRequest = RenderRequest | CancelRequest;

class TypstStageError extends Error {
  constructor(stage: string, error: unknown) {
    const privateStages = new Set([
      "resume validation",
      "resume adaptation",
      "Typst source registration",
      "resume compilation",
    ]);
    const message = error instanceof Error
      ? error.message === "Maximum call stack size exceeded" || error.message === "undefined is not a function"
        ? `${error.name}: ${error.message}`
        : privateStages.has(stage)
          ? `${error.name}: details redacted to protect resume data`
          : `${error.name}: ${error.message}`
      : "Unknown error";
    super(`Typst ${stage} failed: ${message}`);
    this.name = "TypstStageError";
    if (error instanceof Error && error.stack) {
      const frames = error.stack.split("\n").slice(1).join("\n");
      this.stack = `${this.name}: ${this.message}${frames ? `\n${frames}` : ""}`;
    }
  }
}

function stageBeforeBuild(stage: string, callback: BeforeBuildFn): BeforeBuildFn {
  return async (mark, context) => {
    try {
      await callback(mark, context);
    } catch (error) {
      throw new TypstStageError(stage, error);
    }
  };
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const templates = ["readable-classic", "academicv", "modern-cv", "cobalt-cv", "typographic-resume", "vivid-cv", "toy-cv", "altacv", "neat-cv", "rasko-europass"];
const workerScope = self as DedicatedWorkerGlobalScope;
const queued = new Map<string, RenderRequest>();
const latestRequest = new Map<string, number>();
let assetManifestPromise: Promise<AssetManifest> | undefined;
let compilerTemplate: string | undefined;
let compilerPromise: Promise<ReturnType<typeof createTypstCompiler>> | undefined;
let processing = false;

function assetUrl(file: string) {
  const encoded = file.split("/").map(encodeURIComponent).join("/");
  return `${basePath}/typst/${encoded}`;
}

async function fetchFiles(files: string[], receive: (file: string, data: Uint8Array, index: number) => void) {
  let next = 0;
  const load = async () => {
    while (next < files.length) {
      const index = next++;
      const file = files[index];
      const response = await fetch(assetUrl(file));
      if (!response.ok) throw new Error(`Could not load template asset: ${file}`);
      receive(file, new Uint8Array(await response.arrayBuffer()), index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(8, files.length) }, load));
}

async function getAssetManifest() {
  const loadManifest = async () => {
    const response = await fetch(assetUrl("assets.json"));
    if (!response.ok) throw new Error("Could not load Typst assets.");
    return await response.json() as AssetManifest;
  };
  assetManifestPromise ??= loadManifest();
  try {
    return await assetManifestPromise;
  } catch (error) {
    assetManifestPromise = undefined;
    throw error;
  }
}

async function createCompiler(template: string) {
  let stage = "asset manifest loading";
  try {
    const manifest = await getAssetManifest();
    const assets = manifest.templates[template];
    if (!assets) throw new Error(`No Typst assets are configured for ${template}.`);
    const files = new MemoryAccessModel();
    const fonts: Uint8Array[] = new Array(assets.fontFiles.length);
    const roots = new Set(assets.packageRoots);
    await Promise.all([
      fetchFiles(assets.packageFiles, (file, data) => {
        files.insertFile(`/@memory/${file}`, data, new Date());
      }).catch((error: unknown) => { throw new TypstStageError("package loading", error); }),
      fetchFiles(assets.fontFiles, (_file, data, index) => {
        fonts[index] = data;
      }).catch((error: unknown) => { throw new TypstStageError("font loading", error); }),
    ]);
    const registry: PackageRegistry = {
      resolve(spec) {
        const root = `packages/${spec.namespace}/${spec.name}/${spec.version}`;
        return roots.has(root) ? `/@memory/${root}` : undefined;
      },
    };
    stage = "WASM initialization";
    const compiler = createTypstCompiler();
    await compiler.init({
      getModule: () => new URL(`${basePath}/typst/typst_ts_web_compiler_bg.wasm`, workerScope.location.origin),
      beforeBuild: [
        stageBeforeBuild("filesystem initialization", withAccessModel(files)),
        stageBeforeBuild("package registry initialization", withPackageRegistry(registry)),
        stageBeforeBuild("font registration", loadFonts(fonts, { assets: false })),
      ],
    });
    return compiler;
  } catch (error) {
    if (error instanceof TypstStageError) throw error;
    throw new TypstStageError(stage, error);
  }
}

async function getCompiler(template: string) {
  if (compilerTemplate !== template) {
    compilerTemplate = template;
    compilerPromise = undefined;
  }
  compilerPromise ??= createCompiler(template);
  try {
    return await compilerPromise;
  } catch (error) {
    if (compilerTemplate === template) {
      compilerPromise = undefined;
      compilerTemplate = undefined;
    }
    throw error;
  }
}

async function compile(request: RenderRequest) {
  let stage = "resume validation";
  try {
    if (!templates.includes(request.template) || !isResumeData(request.resume)) {
      throw new Error("Invalid template or resume data.");
    }
    stage = "template adapter loading";
    const response = await fetch(assetUrl(`adapters/${request.template}.typ`));
    if (!response.ok) throw new Error(`Could not load the ${request.template} template.`);
    const adapter = await response.text();
    stage = "resume adaptation";
    const data = JSON.stringify(JSON.stringify(adaptResume(request.resume)));
    const source = `#let data = json(bytes(${data}))\n${adapter}`;
    const compiler = await getCompiler(request.template);
    stage = "Typst source registration";
    compiler.addSource("/@memory/main.typ", source);
    stage = "resume compilation";
    const output = await compiler.compile({
      mainFilePath: "/@memory/main.typ",
      root: "/@memory",
      inputs: {},
      format: CompileFormatEnum.pdf,
      diagnostics: "full",
    });
    if (!output.result) {
      const count = output.diagnostics?.filter((item) => item.severity === "error").length ?? 0;
      throw new Error(`Compiler returned ${Math.max(1, count)} error diagnostic(s).`);
    }
    const pdf = new Uint8Array(output.result);
    stage = "Typst cache eviction";
    await compiler.evictCache(10);
    return pdf;
  } catch (error) {
    if (error instanceof TypstStageError) throw error;
    throw new TypstStageError(stage, error);
  }
}

async function processQueue() {
  if (processing) return;
  processing = true;
  try {
    while (queued.size > 0) {
      const next = queued.entries().next().value as [string, RenderRequest] | undefined;
      if (!next) break;
      const [clientId, request] = next;
      queued.delete(clientId);
      if (latestRequest.get(clientId) !== request.id) continue;
      try {
        const pdf = await compile(request);
        if (latestRequest.get(clientId) === request.id) {
          workerScope.postMessage({ type: "result", clientId, id: request.id, pdf });
          latestRequest.delete(clientId);
        }
      } catch (error) {
        if (latestRequest.get(clientId) === request.id) {
          workerScope.postMessage({
            type: "error",
            clientId,
            id: request.id,
            message: error instanceof Error ? error.message : "Typst could not render this resume.",
            stack: error instanceof Error ? error.stack : undefined,
          });
          latestRequest.delete(clientId);
        }
      }
    }
  } finally {
    processing = false;
    if (queued.size > 0) void processQueue();
  }
}

workerScope.onmessage = ({ data }: MessageEvent<WorkerRequest>) => {
  if (data.type === "cancel") {
    if (latestRequest.get(data.clientId) === data.id) {
      latestRequest.delete(data.clientId);
      queued.delete(data.clientId);
    }
    return;
  }
  latestRequest.set(data.clientId, data.id);
  queued.set(data.clientId, data);
  void processQueue();
};
