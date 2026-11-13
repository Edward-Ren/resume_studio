#import "@preview/toy-cv:0.1.0": *
#let contacts = (
  (logo-name: "envelope", logo-text: data.email),
  (logo-name: "phone", logo-text: data.phone),
  (logo-name: "location-dot", logo-text: data.location),
).filter(item => item.logo-text != "")
#show: cv.with(
  title: data.name, subtitle: none,
  avatar: if data.photo != none { image(bytes(data.photo), width: 100%, height: 100%, fit: "cover") } else { none },
  avatar-size: 2.2cm,
  left-content: {
    if contacts.len() > 0 { contact-section(main-color: rgb("#E40019"), i18n: "en", contact-entries: contacts) }
    if data.skillLines.len() > 0 {
      parbreak()
      left-section(title: "Skills", {
        for item in data.skillLines {
          if item.label != "" { strong(item.label + ": ") }
          item.value
          parbreak()
        }
      })
    }
  },
)
#for section in data.sections {
  right-column-subtitle(section.label)
  for item in section.entries {
    cv-entry(title: strong(item.title), date: item.dates, subtitle: item.organization,
      if item.bullets.len() > 0 { list(..item.bullets) } else { [] })
  }
}
