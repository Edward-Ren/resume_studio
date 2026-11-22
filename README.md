# Resume Studio

A local-first resume builder using Next.js, React, TypeScript, and Tailwind CSS.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000, choose **Use Template**, and edit your resume.
Personal details, education, experience, projects, and skills update the preview
immediately. Resume data is stored in this browser's localStorage; existing data
uses the unchanged `resume-studio:resume:v1` key.
An optional profile photo can be uploaded, replaced or removed in Personal Details.
It is resized locally and shown only in templates with native photo support.

Eleven templates share the same editor data. Jake's Resume retains browser printing:
choose Save as PDF, A4, 100% scale, with browser headers/footers off.
The ten Typst templates compile in a WebAssembly worker in your browser. PDF.js
previews the generated PDF, and Download saves those same PDF bytes. Resume data
stays in this browser; no render server or external service is used. On desktop,
the editor and preview scroll independently beneath the fixed header and controls.
See [Typst fonts, packages and attribution](typst/README.md).

`npm run build` creates a static export in `out/`. The GitHub Actions workflow
publishes it to GitHub Pages under `/resume_studio/`; the app remains in this
repository. Typst assets are copied into the ignored `public/typst/` folder before
development and builds.

## Checks

```sh
npm run lint
npm run test:templates
npm run build
```

Manually verify the homepage link, live field edits, add/delete entries, refresh
restoration, mobile layout, and both short and long PDF output.

## Structure

- `app/page.tsx`, `app/template-gallery.tsx`: eleven-template gallery with example previews.
- `app/layout.tsx`, `app/globals.css`: shared metadata and base styling.
- `app/editor/page.tsx`: editing, template selection, storage, and PDF control.
- `app/editor/resume-data.ts`: shared types, example data, and validation.
- `app/editor/templates/`: registry, Jake template, styling, and attribution.

Available: Jake's Resume, readable-classic@0.1.0, academicv@1.1.0,
modern-cv@0.10.0, cobalt-cv@0.1.0, typographic-resume@0.2.0,
vivid-cv@0.2.0, toy-cv@0.1.0, altacv@1.7.0, neat-cv@1.2.0 and rasko-europass@1.0.0.
See the [template guide](app/editor/templates/README.md).

This MVP has no authentication, database, external rendering service, or LaTeX
compilation. The Node route runs the official Typst CLI locally on the server.
Required third-party notices are retained in
[ATTRIBUTION.md](app/editor/templates/ATTRIBUTION.md).
