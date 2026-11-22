"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";

function describeError(error: unknown) {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return detail.replace(/[.!?]+$/, "");
}

// Display only: the original PDF blob is still used directly for download.
export function PdfPreview({ url, firstPageOnly = false }: { url: string; firstPageOnly?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading preview…");

  useEffect(() => {
    const host = container.current!;
    let disposed = false;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    let pdf: PDFDocumentProxy | undefined;
    let rendering: RenderTask | undefined;
    let destruction: Promise<void> | undefined;

    function destroyDocument() {
      if (!loadingTask) return Promise.resolve();
      const task = loadingTask;
      destruction ??= task.destroy().then(() => {
        if (loadingTask === task) loadingTask = undefined;
      });
      return destruction;
    }

    async function render() {
      let phase = "loading PDF.js";
      try {
        const pdfjs = await import("pdfjs-dist");
        if (disposed) return;
        phase = "initializing the PDF.js worker";
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        phase = "loading the PDF";
        loadingTask = pdfjs.getDocument({ url });
        pdf = await loadingTask.promise;
        const count = firstPageOnly ? 1 : pdf.numPages;
        for (let number = 1; number <= count; number++) {
          const page = await pdf.getPage(number);
          if (disposed) return;
          const viewport = page.getViewport({ scale: 1 });
          const targetCssWidth = Math.min(host.clientWidth || (firstPageOnly ? 180 : 800), firstPageOnly ? 180 : 800);
          const pixelWidth = Math.max(1, Math.ceil(targetCssWidth * Math.min(window.devicePixelRatio || 1, 2)));
          const scaled = page.getViewport({ scale: pixelWidth / viewport.width });
          const canvas = window.document.createElement("canvas");
          canvas.width = Math.ceil(scaled.width);
          canvas.height = Math.ceil(scaled.height);
          canvas.className = "resume-pdf-page";
          canvas.style.setProperty("--page-ratio", String(viewport.width / viewport.height));
          canvas.style.setProperty("--page-width", `${viewport.width * 96 / 72}px`);
          canvas.setAttribute("role", "img");
          const text = await page.getTextContent();
          canvas.setAttribute("aria-label", `Resume page ${number} of ${pdf.numPages}. ${text.items.map((item) => "str" in item ? item.str : "").join(" ")}`);
          if (disposed) return;
          phase = `rendering page ${number}`;
          rendering = page.render({ canvas, viewport: scaled });
          await rendering.promise;
          if (disposed) return;
          page.cleanup();
          host.append(canvas);
          rendering = undefined;
        }
        phase = "releasing PDF resources";
        await pdf.cleanup();
        await destroyDocument();
        setStatus("");
      } catch (error) {
        if (!disposed) {
          setStatus(`PDF preview failed while ${phase}: ${describeError(error)}. You can still download the PDF.`);
        }
        void destroyDocument().catch((cleanupError: unknown) => {
          if (!disposed) {
            setStatus(`PDF preview failed while ${phase}; resource cleanup also failed: ${describeError(cleanupError)}. You can still download the PDF.`);
          }
        });
      }
    }
    void render();
    return () => {
      disposed = true;
      rendering?.cancel();
      void destroyDocument().catch((error: unknown) => console.error("Could not release PDF preview resources.", error));
      for (const canvas of host.querySelectorAll("canvas")) {
        canvas.width = 0;
        canvas.height = 0;
      }
      host.replaceChildren();
    };
  }, [url, firstPageOnly]);

  return (
    <div className="resume-pdf-preview" aria-label="Resume preview" aria-busy={status === "Loading preview…"}>
      {status && <p role="status" className="preview-message">{status}</p>}
      <div ref={container} className="resume-pdf-pages" />
    </div>
  );
}
