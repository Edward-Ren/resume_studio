// Adapted from cobalt-cv 0.1.0 (MIT), Vikram Saraph. See ../README.md.
#import "@preview/fontawesome:0.6.0": *

// ─── Configuration ────────────────────────────────────────────────────────────
// Edit these values to customize the look and feel of your resume.
// You should not need to modify anything outside this block for basic use.

#let name         = data.name           // Your full name, displayed in the header
#let accent       = rgb("#002366")       // Accent color used for headings, lines, and icons
#let sidebar-fill = rgb("#eef0f5")       // Background color of the left sidebar
#let sans-font    = "Noto Sans"          // Font used for section headings
#let serif-font   = "Noto Serif"         // Font used for your name in the header
#let col-ratio    = (3fr, 7fr)           // Ratio of sidebar width to main content width
// ──────────────────────────────────────────────────────────────────────────────

#set document(title: [#upper(name)])
#set text(size: 10pt)
#show heading.where(level: 1): set text(font: sans-font, tracking: 0.1em, weight: 500, fill: accent)
#show heading.where(level: 2): set text(size: 12pt)

#set page(margin: (
  top: 1cm,
  left: 1cm,
  right: 1cm,
  bottom: 1cm,
))

// ─── Helper functions ─────────────────────────────────────────────────────────

// Renders your name in the header
#let resume-title() = text(
  font: serif-font,
  tracking: 0.1em,
  weight: 500,
  size: 28pt,
  fill: accent,
)[#upper(name)]

// Renders a work experience entry.
// Usage:
//   #experience(
//     "Company Name",
//     "Job Title",
//     "City, State",
//     "Start – End",
//     (
//       "Bullet point one.",
//       "Bullet point two.",
//     ),
//   )
#let experience(
  company,
  role,
  location,
  dates,
  bullets,
) = [
  == #text(fill: accent)[#company]

  #grid(
    columns: (1fr, 1fr),
    align: (left, right),
    [ #emph[#role] ], [ #emph[#((location, dates).filter(v => v != "").join(" | "))] ],
  )

  #for bullet in bullets {
    [- #bullet]
  }
]

// Renders an education entry.
// Usage:
//   #education(
//     "University Name",
//     "City, State",
//     "Start – End",
//     ("Degree One", "Degree Two"),
//   )
#let education(
  institution,
  location,
  dates,
  degrees,
) = [
  == #institution

  #((location, dates).filter(value => value != "").join(" | ")) \
  #for degree in degrees {
    [ #text(weight: "bold")[#degree] \ ]
  }
]

// Renders a skill category in the sidebar.
// Pass items as an array of strings — they will be joined with " | ".
// Usage:
//   #skill-category("Languages", ("Python", "Rust", "TypeScript"))
#let skill-category(category, items) = [
  == #category

  #items.join(" | ")
]


#align(center)[
  #resume-title()
  #set text(size: 10pt)
  #if data.contact.len() > 0 {
    grid(columns: (1fr, 1fr, 1fr, 1fr), align: center,
      ..(("phone", data.phone), ("envelope", data.email), ("location-dot", data.location))
        .filter(item => item.at(1) != "")
        .map(item => [#text(fill: accent)[#fa-icon(item.at(0), font: "Font Awesome 7 Free Solid")] #item.at(1)]),
    )
  }
]
#line(length: 100%, stroke: accent)
#grid(
  columns: col-ratio, rows: auto, fill: (sidebar-fill, none),
  inset: 5pt, column-gutter: 0.5cm,
  {
    for section in data.sections.filter(s => s.key == "education") {
      heading(upper(section.label))
      for entry in section.entries {
        education(entry.organization, "", entry.dates, if entry.title != "" { (entry.title,) } else { () })
        if entry.bullets.len() > 0 { list(..entry.bullets) }
      }
    }
    if data.skillLines.len() > 0 {
      if data.sections.any(s => s.key == "education") { line(stroke: (dash: "dashed", paint: accent), length: 90%) }
      heading(upper("Skills"))
      for item in data.skillLines {
        if item.label != "" { skill-category(item.label, (item.value,)) }
        else { block(item.value) }
      }
    }
  },
  {
    for section in data.sections.filter(s => s.key != "education") {
      heading(upper(section.label))
      for entry in section.entries {
        experience(entry.organization, entry.title, "", entry.dates, entry.bullets)
      }
    }
  },
)
#line(length: 100%, stroke: accent)
