# Resume templates

The editor owns resume data and the unchanged `resume-studio:resume:v1` key.
Template selection never mutates that data. The registry contains eleven
templates. Jake's component, typography and browser print behavior are unchanged.
The homepage gallery and editor share `resume-preview.tsx`. URL template selection
is independent of stored content.

The ten Typst templates use `typst-data.ts`, `use-typst-preview.ts` and
`app/api/resume/route.ts`. The hook debounces edits, cancels obsolete requests,
revokes PDF object URLs and disables stale downloads. Preview and download use
the same PDF bytes. `pdf-preview.tsx` uses a lazy-loaded PDF.js worker to draw pages
on canvases, without viewer controls or changes to the original download. The
gallery shows only the first page; the editor shows every page. A failed render
leaves editor data intact. `preview.css` scopes desktop scrolling to the editor
and preview panels, and restores the original unrestricted flow for printing.

Upstream packages, fonts, licenses, mapping details and setup instructions are
in [typst/README.md](../../../typst/README.md). User text is JSON data, never
Typst code. New template styling belongs in Typst adapters; do not restyle Jake.

Run lint/build and `npm run test:templates` with the app running. Also verify
switching all eleven templates, refresh persistence, rapid edits, preview/download
byte equality, Jake's print flow and mobile layout in a browser.
