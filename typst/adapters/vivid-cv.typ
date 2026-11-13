#import "@preview/vivid-cv:0.2.0": *
#show: resume.with(
  author: data.name, title: "", location: data.location, email: data.email, phone: data.phone,
  show-photo: data.photo != none,
  photo: if data.photo != none { image(bytes(data.photo), width: 100%, height: 100%, fit: "cover") } else { none },
  // Keep the original portrait's overhang clear when no biography is supplied.
  about-title: "", about-beside: if data.photo != none { v(83pt) } else { [] },
  about-below: [], reference: "",
  heading-color: "#303f3c",
)
#for section in data.sections {
  heading(level: 2, section.label)
  for item in section.entries {
    if section.key == "education" { edu(institution: item.organization, degree: item.title, dates: item.dates) }
    else if section.key == "experience" { work(title: item.title, company: item.organization, dates: item.dates) }
    else { project(name: item.title, role: item.organization, dates: item.dates) }
    if item.bullets.len() > 0 { list(..item.bullets) }
  }
}
#if data.skillLines.len() > 0 {
  heading(level: 2, "Skills")
  for item in data.skillLines {
    if item.label != "" { strong(item.label + ": ") }
    item.value
    parbreak()
  }
}
