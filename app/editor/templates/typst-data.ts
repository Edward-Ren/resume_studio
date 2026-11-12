import { hasEntryContent, type ResumeData } from "../resume-data";

// All packages consume this same lossless, plain-text view of editor data.
// User text is JSON data, never executable Typst markup.
export function adaptResume(resume: ResumeData) {
  const lines = (value: string) => value.split(/\r?\n/).map((line) =>
    line.trim().replace(/^(?:[•●▪]|[-*]\s)\s*/, "")).filter(Boolean);
  const words = resume.name.trim().split(/\s+/);
  return {
    ...resume,
    firstName: words.shift() || "Your Name",
    lastName: words.join(" "),
    name: resume.name.trim() || "Your Name",
    contact: [resume.phone, resume.email, resume.location].filter((v) => v.trim()),
    sections: (["education", "experience", "projects"] as const).map((key) => ({
      key,
      label: { education: "Education", experience: "Work Experience", projects: "Projects" }[key],
      entries: resume[key].filter(hasEntryContent).map((entry) => ({ ...entry, bullets: lines(entry.description) })),
    })).filter((section) => section.entries.length),
    skillLines: lines(resume.skills).map((line) => {
      const colon = line.indexOf(":");
      return { label: colon > 0 ? line.slice(0, colon) : "", value: colon > 0 ? line.slice(colon + 1).trim() : line };
    }),
  };
}
