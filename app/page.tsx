import { TemplateGallery } from "./template-gallery";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf9f6] text-gray-900">
      <header className="mx-auto max-w-6xl px-6 py-6">
        <span className="text-2xl font-bold">Resume Studio.</span>
      </header>
      <section aria-labelledby="gallery-heading" className="mx-auto max-w-6xl px-6 pb-10 pt-5">
        <h1 id="gallery-heading" className="text-3xl font-bold tracking-tight">Choose your resume template</h1>
        <p className="mb-7 mt-3 text-sm leading-6 text-gray-600">Six layouts. Your experience. Switch templates anytime without losing your edits.</p>
        <TemplateGallery />
      </section>
      <footer className="mx-auto max-w-6xl px-6 pb-6 text-xs text-gray-500">
        No account needed. Your edits are saved in this browser.
      </footer>
    </main>
  );
}
