#import "@preview/rasko-europass:1.0.0": *
#let entries(key) = {
  let section = data.sections.find(section => section.key == key)
  if section == none { () } else {
    section.entries.map(item => cv-entry(date-end: item.dates, title: item.title,
      organization: item.organization,
      description: if item.bullets.len() > 0 { list(..item.bullets) } else { none }))
  }
}
#show: europass-cv.with(name: data.name, address: data.location, phone: data.phone, email: data.email,
  photo: if data.photo != none { bytes(data.photo) } else { none }, photo-alt: "Profile photo",
  work-experience: entries("experience"), education: entries("education"), declaration: false,
  other-skills: if data.skillLines.len() > 0 {
    for item in data.skillLines {
      if item.label != "" { strong(item.label + ": ") }
      item.value
      parbreak()
    }
  } else { none },
)
#if entries("projects").len() > 0 {
  grid(columns: (col-date, col-content),
    stroke: (x, y) => if x == 1 { (left: 0.6pt + eu-blue) } else { none },
    grid.cell(inset: cell-inset)[],
    grid.cell(inset: cell-inset)[#heading(level: 2, "Projects")],
    ..entries("projects").flatten(),
  )
}
