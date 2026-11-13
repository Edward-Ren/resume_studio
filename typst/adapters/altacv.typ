#import "@preview/altacv:1.7.0": alta
#let entries(key) = data.sections.find(section => section.key == key)
#let items(key) = if entries(key) == none { () } else { entries(key).entries }
#alta((
  basics: (name: data.name, email: data.email, phone: data.phone, location: data.location,
    image: if data.photo != none { bytes(data.photo) } else { none }),
  work: items("experience").map(item => (name: item.organization, position: item.title,
    endDate: item.dates, highlights: item.bullets)),
  education: items("education").map(item => (institution: item.organization, studyType: item.title,
    endDate: item.dates, score: item.bullets.join(linebreak()))),
  projects: items("projects").map(item => (name: if item.title != "" { item.title } else if item.organization != "" { item.organization } else { "Project" },
    entity: item.organization, endDate: item.dates, highlights: item.bullets)),
  skills: data.skillLines.map(item => (name: item.label, keywords: (item.value,))),
), preferences: (imagePosition: "center", imageStackOrder: "above", headerTextAlign: "center", dateFormat: "iso"))
