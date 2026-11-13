import type { ComponentType } from "react";
import type { ResumeData } from "../resume-data";
import { JakeTemplate } from "./jake-template";

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  sourceUrl: string;
  component: ComponentType<{ resume: ResumeData }> | null;
}

// Jake retains browser printing. Typst templates preview and download one PDF.
export const resumeTemplates = [
  {
    id: "jake",
    name: "Classic Tech", description: "Compact, traditional typography",
    sourceUrl: "https://github.com/jakegut/resume",
    component: JakeTemplate,
  },
  {
    id: "readable-classic", name: "Classic Professional", description: "Timeless serif layout",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/readable-classic/0.1.0",
    component: null,
  },
  {
    id: "academicv", name: "Academic CV", description: "Structured academic style",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/academicv/1.1.0",
    component: null,
  },
  {
    id: "modern-cv", name: "Modern Professional", description: "Clean lines and subtle color",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/modern-cv/0.10.0",
    component: null,
  },
  {
    id: "cobalt-cv", name: "Sidebar Professional", description: "Shaded sidebar with clear sections",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/cobalt-cv/0.1.0",
    component: null,
  },
  {
    id: "typographic-resume", name: "Editorial", description: "Refined typography and airy spacing",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/typographic-resume/0.2.0",
    component: null,
  },
  {
    id: "vivid-cv", name: "Bold & Colorful", description: "Vibrant banner and bold accents",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/vivid-cv/0.2.0",
    component: null,
  },
  {
    id: "toy-cv", name: "Creative Sidebar", description: "Bright header and contrasting sidebar",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/toy-cv/0.1.0",
    component: null,
  },
  {
    id: "altacv", name: "Modern Two-Column", description: "Balanced columns with teal accents",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/altacv/1.7.0",
    component: null,
  },
  {
    id: "neat-cv", name: "Clean & Refined", description: "Understated type and slim sidebar",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/neat-cv/1.2.0",
    component: null,
  },
  {
    id: "rasko-europass", name: "European CV", description: "Structured Europass format",
    sourceUrl: "https://github.com/typst/packages/tree/main/packages/preview/rasko-europass/1.0.0",
    component: null,
  },
] as const satisfies readonly ResumeTemplate[];

export type ResumeTemplateId = (typeof resumeTemplates)[number]["id"];
