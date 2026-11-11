import type { ComponentType } from "react";
import type { ResumeData } from "../resume-data";
import { JakeTemplate } from "./jake-template";

export interface ResumeTemplate {
  id: string;
  name: string;
  sourceUrl: string;
  component: ComponentType<{ resume: ResumeData }>;
}

// Add approved templates here. Each receives the same editor data and renders
// the document used for both the live preview and browser PDF printing.
export const resumeTemplates = [
  {
    id: "jake",
    name: "Jake's Resume",
    sourceUrl: "https://github.com/jakegut/resume",
    component: JakeTemplate,
  },
] as const satisfies readonly ResumeTemplate[];

export type ResumeTemplateId = (typeof resumeTemplates)[number]["id"];
