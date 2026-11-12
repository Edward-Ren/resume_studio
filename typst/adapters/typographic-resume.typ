#import "@preview/typographic-resume:0.2.0": *
#show: resume.with(
  first-name: data.firstName, last-name: data.lastName,
  aside: {
    if data.contact.len() > 0 {
      section("Contact", {
        set image(width: 8pt)
        if data.phone != "" { contact-entry(phone-icon, data.phone) }
        if data.email != "" {
          if data.phone != "" { line(stroke: 0.1pt, length: 100%) }
          contact-entry(email-icon, data.email)
        }
        if data.location != "" {
          if data.phone != "" or data.email != "" { line(stroke: 0.1pt, length: 100%) }
          contact-entry([], data.location)
        }
      })
    }
    if data.skillLines.len() > 0 {
      section("Skills", {
        set text(font: "Roboto", size: 8pt)
        stack(spacing: 8pt, ..data.skillLines.map(item => [
          #if item.label != "" { strong(item.label + ": ") }#item.value
        ]))
      })
    }
  },
)
#for (i, item) in data.sections.enumerate() {
  section(theme: if i == 0 { (space-above: 0pt) } else { (:) }, item.label, {
    if item.key == "education" {
      grid(columns: 2, column-gutter: default-theme.margin,
        ..item.entries.map(entry => education-entry(
          title: entry.title, institution: entry.organization, timeframe: entry.dates,
          entry.bullets.join(linebreak()),
        )),
      )
    } else {
      for (j, entry) in item.entries.enumerate() {
        work-entry(
          theme: if j == 0 { (space-above: 0pt) } else { (:) },
          timeframe: entry.dates, title: entry.title, organization: entry.organization,
          entry.bullets.join(linebreak()),
        )
      }
    }
  })
}
