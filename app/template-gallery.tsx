import Image from "next/image";
import Link from "next/link";
import { resumeTemplates, type ResumeTemplate } from "./editor/templates";
import "./editor/templates/preview.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function TemplateCard({ template }: { template: ResumeTemplate }) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="gallery-preview" aria-hidden="true">
        <Image src={`${basePath}/thumbnails/${template.id}.webp`} alt="" width={480} height={680}
          unoptimized className="gallery-thumbnail" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-4">
        <div>
          <h2 className="text-sm font-semibold">{template.name}</h2>
          <p className="mt-1 text-xs text-gray-500">{template.description}</p>
        </div>
        <Link href={`/editor?template=${template.id}`} aria-label={`Use Template: ${template.name}`}
          className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2">
          Use Template
        </Link>
      </div>
    </article>
  );
}

export function TemplateGallery() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {resumeTemplates.map((template) => <TemplateCard key={template.id} template={template} />)}
    </div>
  );
}
