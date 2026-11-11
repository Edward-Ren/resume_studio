import Link from "next/link";
import { initialResume } from "./editor/resume-data";
import { resumeTemplates } from "./editor/templates";

export default function Home() {
  const template = resumeTemplates[0];
  const Template = template.component;

  return (
    <main className="min-h-screen bg-[#faf9f6] text-gray-900">
      <header className="mx-auto max-w-6xl px-6 py-6">
        <span className="text-2xl font-bold">Resume Studio.</span>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-10 md:grid-cols-[0.85fr_1.15fr] md:gap-16 md:py-16">
        <div>
          <h1 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            A better resume starts here.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-gray-600">
            Your experience, clearly presented. Edit your details, see every
            change live, and download a polished PDF.
          </p>

          <div className="mt-10 border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold">{template.name}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
              A timeless, single-column layout with crisp typography and room
              for what matters. Ready to make your own.
            </p>
            <Link href="/editor"
              className="mt-6 inline-flex rounded-lg bg-gray-900 px-7 py-3 text-sm font-medium text-white transition hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-900">
              Use Template
            </Link>
            <p className="mt-3 text-xs leading-5 text-gray-500">
              No account needed. Your edits are saved in this browser.
            </p>
          </div>
        </div>

        <figure className="min-w-0">
          <Template resume={initialResume} />
          <figcaption className="mt-4 text-center text-xs leading-5 text-gray-500">
            {template.name} · A4 · Example content
          </figcaption>
        </figure>
      </section>

      <footer className="mx-auto max-w-6xl border-t border-gray-200 px-6 py-6 text-sm text-gray-500">
        Template inspired by <a href={template.sourceUrl} className="underline underline-offset-4 hover:text-gray-900">{template.name}</a>.
      </footer>
    </main>
  );
}
