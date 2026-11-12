# Original Typst templates

Run `npm run setup:typst` once to install the official **Typst 0.15.1** CLI
in the ignored `.typst/` directory. Alternatively set `TYPST_BIN` to its absolute
path. A Node server capable of spawning the native binary is required; static
hosting and Edge runtimes cannot render these templates. Run setup on the target
OS/architecture before building/deploying. The server renderer uses no external
rendering service or npm dependency. Rendering sends resume data to this application's server, uses stdin,
does not write resume files, and returns a non-cacheable PDF.

`packages/preview/` contains unmodified archives from
`https://packages.typst.org/preview/{name}-{version}.tar.gz`, corresponding to
[typst/packages](https://github.com/typst/packages/tree/main/packages/preview).
Their manifests, sources, examples, assets and available license notices are retained.

| Package | Author | License |
| --- | --- | --- |
| readable-classic 0.1.0 | Super Lede | MIT; example content MIT-0 |
| academicv 1.1.0 | Mikkel Roald-Arbøl, Je Sian Keith Herman | Apache-2.0 |
| modern-cv 0.10.0 | Paul Tsouchlos | MIT |
| cobalt-cv 0.1.0 | Vikram Saraph | MIT |
| typographic-resume 0.2.0 | tsnobip | MIT (declared in upstream manifest) |
| fontawesome 0.6.0 | See package manifest | MIT |
| linguify 0.5.0 | See package manifest | MIT |

The typographic-resume archive and its upstream repository do not supply a
standalone license text. Its original author and MIT declaration are retained
in `typst.toml`; a standard MIT notice is supplied separately in
`typographic-resume-NOTICE.md` without claiming it is an upstream file.

## Fonts and icons

Open fonts are bundled with their OFL notices from
[google/fonts](https://github.com/google/fonts/tree/main/ofl): Noto Sans, Noto
Serif, Libre Baskerville, Roboto, Montserrat and Source Sans 3. Typst 0.15.1
supports these variable fonts, including the original requested weights.
Libertinus Serif is embedded in the official compiler. Font Awesome 7 Free
Regular, Solid and Brands are from
[Font-Awesome/7.x](https://github.com/FortAwesome/Font-Awesome/tree/7.x/otfs),
with the original license in `fonts/fontawesome/LICENSE.txt` (fonts: OFL;
SVG icons: CC BY 4.0; code: MIT). The original typographic-resume SVG icons
retain Fonticons attribution in their source.

**Georgia must be installed on the server** for readable-classic. It is present
on Windows here and is not redistributed. On another host install a licensed
copy or set `TYPST_FONT_PATHS` to its directory. Missing required fonts produce
an explicit error rather than silently substituting fonts. Additional scripts
such as CJK may require appropriate system fonts.

## Data bindings and fidelity

`app/editor/templates/typst-data.ts` is the common plain-text adapter. Empty
entries/sections are hidden; dates remain free text; descriptions become lines
or bullets according to each template. Skills retain labels and unlabeled lines.
Names split at the first space for templates with separate first/last fields.
No fictional photo, biography, job title, links or per-entry location is added.

The five `adapters/*.typ` files call the original package functions. Cobalt
ships only a standalone document, so its adapter retains the original settings,
helpers and grid and replaces sample content with data bindings. Empty location
separators are suppressed. Its skills/education stay in the shaded sidebar.
Typographic uses its original two-column education grid. Academicv uses the
1.1.0 library (the shipped example incorrectly imports 1.0.0) and example
settings; its prose `eval` is avoided to keep user text literal. Modern-cv uses
the first original font fallback, Source Sans 3, and disables the absent photo.
Native page sizes, spacing, colors and typography are retained.

Preview uses PDF.js to draw the generated PDF as clean canvas pages; Download
saves the original PDF bytes. PDF.js is a preview-only dependency and its worker
is bundled locally. No embedded browser PDF viewer is required.
Stale rendering responses cannot enable download or overwrite a newer preview.
Rendering is debounced 350 ms, limited to 30 seconds and a 200,000-character
request. Very long/unbreakable content remains subject to upstream layout rules.

Run the app, then `npm run test:templates` for normal, empty, special-character,
long-resume and invalid-request coverage. `TEST_BASE_URL` selects another server.
