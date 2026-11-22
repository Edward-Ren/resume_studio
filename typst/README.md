# Original Typst templates

The templates compile to PDF in the browser using the pinned Typst.ts
WebAssembly compiler. No Typst CLI, Node rendering server, or external rendering
service is needed. `npm run predev` and `npm run prebuild` copy the vendored
adapters, packages and fonts and the WebAssembly module into the ignored
`public/typst/` directory for local development and static export.

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
| vivid-cv 0.2.0 | Loïc Fontaine | MIT |
| toy-cv 0.1.0 | Pierre GUYOT | MIT LICENSE retained; manifest declares MIT-0 |
| altacv 1.7.0 | Shane Murphy; earlier George Honeywood attribution retained | MIT |
| neat-cv 1.2.0 | Diego Alvarez S. | MIT |
| rasko-europass 1.0.0 | rasko-- | MIT; upstream NOTICE retained |
| fontawesome 0.6.0 | See package manifest | MIT |
| fontawesome 0.6.1, 0.6.2 | See package manifests | MIT |
| datify 1.0.1, datify-core 1.0.0 | See package manifests | MIT |
| gairm-import 0.8.1, zebra 0.1.0 | See package manifests | MIT |
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

Lato and Fira Sans are bundled from Google Fonts with OFL notices. Inter and
Font Awesome 6 come from [Toy CV's original font assets](https://github.com/ToyHugs/toy-cv/tree/main/src/fonts),
including their licenses. Open Sans comes from [Europass's original font assets](https://github.com/Raskolny/europass-cv/tree/main/fonts)
with its Apache-2.0 license. Font Awesome 6 is required by Toy CV's original icon ligatures.

Georgia is not redistributed. `readable-classic` falls back to the compiler's
Libertinus Serif when Georgia is unavailable. The open fonts listed above are
loaded from this repository's static assets; the browser does not need system
font access. Additional scripts such as CJK may require appropriate fonts.

## Data bindings and fidelity

`app/editor/templates/typst-data.ts` is the common plain-text adapter. Empty
entries/sections are hidden; dates remain free text; descriptions become lines
or bullets according to each template. Skills retain labels and unlabeled lines.
Names split at the first space for templates with separate first/last fields.
No fictional photo, biography, job title, links or per-entry location is added.

The `adapters/*.typ` files call the original package functions. Cobalt
ships only a standalone document, so its adapter retains the original settings,
helpers and grid and replaces sample content with data bindings. Empty location
separators are suppressed. Its skills/education stay in the shaded sidebar.
Typographic uses its original two-column education grid. Academicv uses the
1.1.0 library (the shipped example incorrectly imports 1.0.0) and example
settings; its prose `eval` is avoided to keep user text literal. Modern-cv uses
the first original font fallback, Source Sans 3.
Native page sizes, spacing, colors and typography are retained.

The five additional packages' exact pinned dependencies are vendored. All ten
Typst templates are covered by `npm run test:templates`, including plugin-backed
templates, photos, empty resumes, literal special characters and long resumes.
Vivid, Neat, Toy and AltaCV use the upstream starter configuration. Europass
uses its original defaults. Vivid's empty intro reserves clearance for its
overhanging portrait; Toy's populated sidebar sections use normal paragraph spacing.
Europass projects use its exported entry helper and original grid geometry inside its
supported body slot. Its optional legal declaration is disabled because the
editor supplies no declaration. AltaCV education descriptions use its unlabelled
score content slot; free-text dates are preserved rather than parsed.

An optional `photo` JPEG data URL extends saved resumes without changing the
storage key; old resumes remain valid. Uploads accept JPEG/PNG/WebP up to 10 MB,
resize to at most 512 pixels per edge, strip metadata and cap the saved data URL
at 200,000 characters. The shared adapter passes image bytes through stdin.
All five new templates, Modern CV and Typographic Resume use their native photo
slots; the remaining templates ignore the photo. Images are sent only to this
app's renderer with the resume, never saved as server files.

Preview uses PDF.js to draw the generated PDF as clean canvas pages; Download
saves the original PDF bytes. PDF.js is a preview-only dependency and its worker
is bundled locally. No embedded browser PDF viewer is required.
Stale rendering responses cannot enable download or overwrite a newer preview.
Rendering is debounced 350 ms and stale jobs are discarded. Very long or
unbreakable content remains subject to upstream layout rules.

The Typst compiler runs in a worker so compilation does not block editor input.
