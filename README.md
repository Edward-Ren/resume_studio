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

**Download PDF** opens browser printing. Choose Save as PDF, A4, 100% scale,
and turn off browser headers and footers. Long resumes flow onto more pages.

## Checks

```sh
npm run lint
npm run build
```

Manually verify the homepage link, live field edits, add/delete entries, refresh
restoration, mobile layout, and both short and long PDF output.

## Structure

- `app/page.tsx`: homepage with the real template and example data.
- `app/layout.tsx`, `app/globals.css`: shared metadata and base styling.
- `app/editor/page.tsx`: editing, template selection, storage, and PDF control.
- `app/editor/resume-data.ts`: shared types, example data, and validation.
- `app/editor/templates/`: registry, Jake template, styling, and attribution.

Only Jake's Resume is currently available. See
[template guide](app/editor/templates/README.md) before adding another template.
The homepage and editor use the same registry and rendering component.

This MVP has no authentication, database, external rendering API, or LaTeX
compilation. Required third-party notices are retained in
[ATTRIBUTION.md](app/editor/templates/ATTRIBUTION.md).
