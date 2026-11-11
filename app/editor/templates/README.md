# Resume templates

The editor owns the resume data and localStorage auto-save. Template selection
is separate UI state; it never changes saved resume content.

`index.tsx` is the template registry. `jake-template.tsx` is the only current
template, using `resume.css` for the A4 sheet and print layout. The selected
component receives `ResumeData` and renders the same selectable HTML text used
in the preview and PDF. Download PDF opens the browser's print dialog.

To add a template:

1. Verify that the reference's license permits the planned use and retain its
   required notices. Jake's attribution and MIT notice are in ATTRIBUTION.md.
2. Add a component accepting `{ resume: ResumeData }`. Keep storage, editing,
   and export controls outside the component.
3. Register its unique id, name, sourceUrl, and component in `index.tsx`.
4. Reuse the sheet/print structure. Scope any new visual styles to the template
   so they do not affect other templates or the homepage.
5. Verify empty sections, long text, multiple entries, mobile widths, and both
   one-page and multi-page PDFs. Never clip content to a fixed page height.

Browser PDF settings: Save as PDF, A4, 100% scale, headers/footers off.
No external rendering service or compilation step is required.
