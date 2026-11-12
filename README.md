# Resume Studio

A local-first resume builder using Next.js, React, TypeScript, and Tailwind CSS.

## Run locally

```sh
npm install
npm run setup:typst
npm run dev
```

Open http://localhost:3000, choose **Use Template**, and edit your resume.
Personal details, education, experience, projects, and skills update the preview
immediately. Resume data is stored in this browser's localStorage; existing data
uses the unchanged `resume-studio:resume:v1` key.

Six templates share the same editor data. Jake's Resume retains browser printing:
choose Save as PDF, A4, 100% scale, with browser headers/footers off.
The five original Typst templates preview and download the same generated PDF.
PDF.js draws clean page previews without embedded browser controls. The homepage
gallery links to `/editor?template=...`; saved content is preserved. On desktop,
the editor and preview scroll independently beneath the fixed header and controls.
Typst rendering sends your data to this app's server; localStorage is unchanged.
See [Typst setup, fonts and attribution](typst/README.md) for deployment details.
Georgia must be installed for readable-classic; it is not bundled.

## Checks

```sh
npm run lint
npm run build
# With the app running:
npm run test:templates
```

Manually verify the homepage link, live field edits, add/delete entries, refresh
restoration, mobile layout, and both short and long PDF output.

## Structure

- `app/page.tsx`, `app/template-gallery.tsx`: six-template gallery with example previews.
- `app/layout.tsx`, `app/globals.css`: shared metadata and base styling.
- `app/editor/page.tsx`: editing, template selection, storage, and PDF control.
- `app/editor/resume-data.ts`: shared types, example data, and validation.
- `app/editor/templates/`: registry, Jake template, styling, and attribution.

Available: Jake's Resume, readable-classic@0.1.0, academicv@1.1.0,
modern-cv@0.10.0, cobalt-cv@0.1.0 and typographic-resume@0.2.0.
See the [template guide](app/editor/templates/README.md).

This MVP has no authentication, database, external rendering service, or LaTeX
compilation. The Node route runs the official Typst CLI locally on the server.
Required third-party notices are retained in
[ATTRIBUTION.md](app/editor/templates/ATTRIBUTION.md).
