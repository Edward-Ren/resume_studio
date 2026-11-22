/// <reference lib="webworker" />

import { CompileFormatEnum, createTypstCompiler } from "@myriaddreamin/typst.ts/compiler";
import { MemoryAccessModel } from "@myriaddreamin/typst.ts/fs/memory";
import type { PackageRegistry } from "@myriaddreamin/typst.ts/internal.types";
import { loadFonts, withAccessModel, withPackageRegistry } from "@myriaddreamin/typst.ts/options.init";
import { isResumeData, type ResumeData } from "../resume-data";
import { adaptResume } from "./typst-data";

interface AssetManifest {
  packageRoots: string[];
  packageFiles: string[];
  fontFiles: string[];
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

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const templates = ["readable-classic", "academicv", "modern-cv", "cobalt-cv", "typographic-resume", "vivid-cv", "toy-cv", "altacv", "neat-cv", "rasko-europass"];
const workerScope = self as DedicatedWorkerGlobalScope;
const queued = new Map<string, RenderRequest>();
const latestRequest = new Map<string, number>();
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

async function createCompiler() {
  const manifestResponse = await fetch(assetUrl("assets.json"));
  if (!manifestResponse.ok) throw new Error("Could not load Typst assets.");
  const manifest = await manifestResponse.json() as AssetManifest;
  const files = new MemoryAccessModel();
  const fonts: Uint8Array[] = new Array(manifest.fontFiles.length);
  await Promise.all([
    fetchFiles(manifest.packageFiles, (file, data) => {
      files.insertFile(`/@memory/${file}`, data, new Date());
    }),
    fetchFiles(manifest.fontFiles, (_file, data, index) => {
      fonts[index] = data;
    }),
  ]);
  const roots = new Set(manifest.packageRoots);
  const registry: PackageRegistry = {
    resolve(spec) {
      const root = `packages/${spec.namespace}/${spec.name}/${spec.version}`;
      return roots.has(root) ? `/@memory/${root}` : undefined;
    },
  };
  const compiler = createTypstCompiler();
  await compiler.init({
    getModule: () => new URL(`${basePath}/typst/typst_ts_web_compiler_bg.wasm`, workerScope.location.origin),
    beforeBuild: [
      withAccessModel(files),
      withPackageRegistry(registry),
      loadFonts(fonts, { assets: false }),
    ],
  });
  return compiler;
}

async function getCompiler() {
  compilerPromise ??= createCompiler();
  try {
    return await compilerPromise;
  } catch (error) {
    compilerPromise = undefined;
    throw error;
  }
}

async function compile(request: RenderRequest) {
  if (!templates.includes(request.template) || !isResumeData(request.resume)) {
    throw new Error("Invalid template or resume data.");
  }
  const response = await fetch(assetUrl(`adapters/${request.template}.typ`));
  if (!response.ok) throw new Error(`Could not load the ${request.template} template.`);
  const data = JSON.stringify(JSON.stringify(adaptResume(request.resume)));
  const source = `#let data = json(bytes(${data}))\n${await response.text()}`;
  const compiler = await getCompiler();
  compiler.addSource("/@memory/main.typ", source);
  const output = await compiler.compile({
    mainFilePath: "/@memory/main.typ",
    root: "/@memory",
    inputs: {},
    format: CompileFormatEnum.pdf,
    diagnostics: "full",
  });
  if (!output.result) {
    const errors = output.diagnostics?.filter((item) => item.severity === "error").map((item) => item.message);
    throw new Error(errors?.join("\n") || "Typst could not render this resume.");
  }
  return output.result;
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
