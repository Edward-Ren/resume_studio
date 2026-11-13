#import "@preview/neat-cv:1.2.0": cv, cv-with-side, contact-info, entry
#let author = (firstname: data.firstName, lastname: data.lastName)
#for (key, value) in (email: data.email, phone: data.phone, address: data.location) {
  if value != "" { author.insert(key, value) }
}
#set text(lang: "en")
#show: cv.with(author: author,
  profile-picture: if data.photo != none { image(bytes(data.photo)) } else { none },
  accent-color: rgb("#4682b4"), header-color: rgb("#35414d"),
)
#cv-with-side[
  #if data.contact.len() > 0 { heading("Contact"); contact-info() }
  #if data.skillLines.len() > 0 {
    heading("Skills")
    for item in data.skillLines {
      if item.label != "" { strong(item.label + ": ") }
      item.value
      parbreak()
    }
  }
][
  #for section in data.sections {
    heading(section.label)
    for item in section.entries {
      entry(title: item.title, date: item.dates, institution: item.organization,
        if item.bullets.len() > 0 { list(..item.bullets) } else { [] })
    }
  }
]
