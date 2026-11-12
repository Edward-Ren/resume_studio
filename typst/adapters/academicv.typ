#import "@preview/academicv:1.1.0": *
// Settings from the upstream example; all layout functions are unmodified.
#let settings = (
  font-heading: "Libertinus Serif", font-body: "Libertinus Serif",
  fontsize: 10pt, spacing-section: 12pt, spacing-entry: 0.1em,
  spacing-element: 3pt, spacing-line: 5pt, color-hyperlink: rgb(50, 120, 180),
)
#set page(paper: "a4", numbering: "1 / 1", number-align: center, margin: 3.5cm)
#show: doc => showrules(settings, setrules(settings, doc))
#layout-header((
  personal: (
    name: data.name,
    location: if data.location != "" { (city: data.location) } else { none },
    contact: (
      email: if data.email != "" { data.email } else { none },
      phone: if data.phone != "" { data.phone } else { none },
    ),
  ),
  sections: ((layout: "header", "show": true, "include": ("location", "contact")),),
), settings)
#for section in data.sections {
  let entries = section.entries.map(entry => (
    institution: if entry.organization != "" { entry.organization } else { entry.title },
    title: if entry.organization != "" and entry.title != "" { entry.title } else { none },
    start-date: entry.dates,
    description: entry.bullets.join(linebreak()),
  ))
  cvsection((
    entries: entries, primary-element: "institution",
    secondary-element: "title", tertiary-element: "description",
  ), layout: "timeline", section: "entries", title: section.label, settings: settings)
}
#if data.skillLines.len() > 0 {
  heading(level: 2, "Skills")
  // Avoid upstream prose's eval(): editor text is always literal content.
  for item in data.skillLines {
    pad(left: 2em)[#if item.label != "" { strong(item.label + ": ") }#item.value]
  }
}
