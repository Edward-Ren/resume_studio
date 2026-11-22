"use client";

import { useEffect, useId, useState } from "react";
import type { ResumeData } from "../resume-data";

type WorkerResponse =
  | { type: "result"; clientId: string; id: number; pdf: Uint8Array }
  | { type: "error"; clientId: string; id: number; message: string; stack?: string };
type WorkerCallback = (response: WorkerResponse) => void;

let renderWorker: Worker | undefined;
let nextRequestId = 0;
const callbacks = new Map<number, WorkerCallback>();

function getRenderWorker() {
  if (!renderWorker) {
    renderWorker = new Worker(new URL("./typst.worker.ts", import.meta.url), { type: "module" });
    renderWorker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      const callback = callbacks.get(data.id);
      callbacks.delete(data.id);
      callback?.(data);
    };
    renderWorker.onerror = (event) => {
      const error = event.message || "The Typst worker stopped unexpectedly.";
      for (const [id, callback] of callbacks) {
        callback({ type: "error", clientId: "", id, message: error, stack: event.error instanceof Error ? event.error.stack : undefined });
      }
      callbacks.clear();
    };
  }
  return renderWorker;
}

export function useTypstPreview(template: string, resume: ResumeData, ready: boolean) {
  const key = JSON.stringify({ template, resume });
  const clientId = useId();
  const [result, setResult] = useState({ key: "", url: "", error: "" });
  useEffect(() => {
    if (!ready || template === "jake") return;
    const controller = new AbortController();
    let url = "";
    let requestId: number | undefined;
    let worker: Worker | undefined;
    const timer = setTimeout(async () => {
      worker = getRenderWorker();
      requestId = ++nextRequestId;
      callbacks.set(requestId, (response) => {
        if (controller.signal.aborted) return;
        if (response.type === "error") {
          if (response.stack) console.error(response.message, response.stack);
          setResult({ key, url: "", error: response.message });
          return;
        }
        const buffer = new ArrayBuffer(response.pdf.byteLength);
        new Uint8Array(buffer).set(response.pdf);
        url = URL.createObjectURL(new Blob([buffer], { type: "application/pdf" }));
        setResult({ key, url, error: "" });
      });
      worker.postMessage({
        type: "render",
        clientId,
        id: requestId,
        template,
        resume,
      });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
      if (requestId !== undefined) {
        callbacks.delete(requestId);
        worker?.postMessage({ type: "cancel", clientId, id: requestId });
      }
      if (url) URL.revokeObjectURL(url);
    };
  }, [key, ready, template, clientId, resume]);
  // Never allow downloading a PDF compiled from earlier edits or another template.
  return result.key === key ? result : { key, url: "", error: "" };
}
