#import "@preview/modern-cv:0.10.0": *
#show: resume.with(
  author: (
    firstname: data.firstName, lastname: data.lastName,
    email: data.email, phone: data.phone, address: data.location,
    positions: (),
  ),
  show-footer: false, show-address-icon: true,
  profile-picture: if data.photo != none { image(bytes(data.photo)) } else { none },
  font: "Source Sans 3", // First font in the upstream fallback list, bundled here.
  paper-size: "us-letter", colored-headers: true,
  contact-items-separator: box[#h(2pt)#text("|")#h(2pt)],
)
#for section in data.sections {
  heading(section.label)
  for entry in section.entries {
    resume-entry(
      title: if section.key == "education" { entry.organization } else { entry.title },
      description: if section.key == "education" { entry.title } else { entry.organization },
      date: entry.dates,
    )
    if entry.bullets.len() > 0 { resume-item(list(..entry.bullets)) }
  }
}
#if data.skillLines.len() > 0 {
  heading("Skills")
  for item in data.skillLines {
    if item.label != "" { resume-skill-item(item.label, (item.value,)) }
    else { resume-item(item.value) }
  }
  block(below: 0.65em)
}
