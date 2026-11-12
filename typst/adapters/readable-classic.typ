#import "@preview/readable-classic:0.1.0": *
#show: resume.with(name: data.name, contact: data.contact)
#for section in data.sections {
  heading(section.label)
  for entry in section.entries {
    let body = if entry.bullets.len() > 0 { list(..entry.bullets) } else { [] }
    if section.key == "education" {
      education(school: entry.organization, degree: entry.title, date: entry.dates, body)
    } else if section.key == "experience" {
      experience(company: entry.organization, title: entry.title, date: entry.dates, body)
    } else {
      activity(name: entry.title, role: entry.organization, date: entry.dates, body)
    }
  }
}
#if data.skillLines.len() > 0 {
  heading("Skills")
  for (i, item) in data.skillLines.enumerate() {
    if i > 0 { linebreak() }
    if item.label != "" { strong(item.label + ": ") }
    item.value
  }
}
