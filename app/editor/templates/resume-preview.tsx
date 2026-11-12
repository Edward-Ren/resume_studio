"use client";

import type { ResumeData } from "../resume-data";
import type { ResumeTemplate } from "./index";
import { PdfPreview } from "./pdf-preview";
import "./preview.css";

export function ResumePreview({ template, resume, pdf, compact = false }: {
  template: ResumeTemplate;
  resume: ResumeData;
  pdf: { url: string; error: string };
  compact?: boolean;
}) {
  const Template = template.component;
  return (
    <div className="resume-preview">
      {Template ? <Template resume={resume} /> : pdf.url ? (
        <PdfPreview key={pdf.url} url={pdf.url} firstPageOnly={compact} />
      ) : (
        <p role={pdf.error ? "alert" : "status"} className="preview-message">{pdf.error || "Rendering resume…"}</p>
      )}
    </div>
  );
}
