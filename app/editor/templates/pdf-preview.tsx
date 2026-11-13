"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, RenderTask } from "pdfjs-dist";

// Display only: the original PDF blob is still used directly for download.
export function PdfPreview({ url, firstPageOnly = false }: { url: string; firstPageOnly?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading preview…");

  useEffect(() => {
    const host = container.current!;
    let disposed = false;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    let rendering: RenderTask | undefined;

    async function render() {
      try {
        const pdfjs = await import("pdfjs-dist");
        if (disposed) return;
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        loadingTask = pdfjs.getDocument({ url });
        const pdf = await loadingTask.promise;
        const count = firstPageOnly ? 1 : pdf.numPages;
        for (let number = 1; number <= count; number++) {
          const page = await pdf.getPage(number);
          if (disposed) return;
          const viewport = page.getViewport({ scale: 1 });
          const pixelWidth = (firstPageOnly ? 180 : 800) * Math.min(window.devicePixelRatio || 1, 2);
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
          rendering = page.render({ canvas, viewport: scaled });
          await rendering.promise;
          if (disposed) return;
          host.append(canvas);
        }
        setStatus("");
      } catch {
        if (!disposed) setStatus("Preview could not be displayed. You can still download the PDF.");
      }
    }
    void render();
    return () => {
      disposed = true;
      rendering?.cancel();
      void loadingTask?.destroy().catch(() => {});
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
