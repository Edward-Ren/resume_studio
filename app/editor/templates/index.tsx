import type { ComponentType } from "react";
import type { ResumeData } from "../resume-data";
import { JakeTemplate } from "./jake-template";

export interface ResumeTemplate {
  id: string;
  name: string;
  sourceUrl: string;
  component: ComponentType<{ resume: ResumeData }> | null;
}

// Jake retains browser printing. Typst templates preview and download one PDF.
export const resumeTemplates = [
  {
    id: "jake",
    name: "Jake's Resume",
    sourceUrl: "https://github.com/jakegut/resume",
    component: JakeTemplate,
  },
  {
    id: "readable-classic", name: "readable-classic@0.1.0",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/readable-classic/0.1.0",
    component: null,
  },
  {
    id: "academicv", name: "academicv@1.1.0",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/academicv/1.1.0",
    component: null,
  },
  {
    id: "modern-cv", name: "modern-cv@0.10.0",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/modern-cv/0.10.0",
    component: null,
  },
  {
    id: "cobalt-cv", name: "cobalt-cv@0.1.0",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/cobalt-cv/0.1.0",
    component: null,
  },
  {
    id: "typographic-resume", name: "typographic-resume@0.2.0",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/typographic-resume/0.2.0",
    component: null,
  },
] as const satisfies readonly ResumeTemplate[];

export type ResumeTemplateId = (typeof resumeTemplates)[number]["id"];
