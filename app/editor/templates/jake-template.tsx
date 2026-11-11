import { hasEntryContent, type ResumeData, type SectionKey } from "../resume-data";
import "./resume.css";

// Visual adaptation of Jake's Resume; see ATTRIBUTION.md in this directory.
const sections: { key: SectionKey; label: string }[] = [
  { key: "education", label: "Education" },
  { key: "experience", label: "Work Experience" },
  { key: "projects", label: "Projects" },
];

function descriptionLines(description: string) {
  return description.split(/\r?\n/)
    .map((line) => line.trim().replace(/^(?:[•●▪]|[-*]\s)\s*/, ""))
    .filter(Boolean);
}

export function JakeTemplate({ resume }: { resume: ResumeData }) {
  const contact = [resume.phone, resume.email, resume.location].map((value) => value.trim()).filter(Boolean);

  return (
    <div className="resume-sheet-container">
      <article aria-label="Resume preview" className="resume-sheet">
        <header className="resume-heading">
          <h2>{resume.name.trim() || "Your Name"}</h2>
          {contact.length > 0 && <p>{contact.join(" | ")}</p>}
        </header>
        {sections.map(({ key, label }) => {
          const entries = resume[key].filter(hasEntryContent);
          return entries.length > 0 ? (
            <section key={key} className="resume-section">
              <h3>{label}</h3>
              {entries.map((entry) => {
                const bullets = descriptionLines(entry.description);
                const primary = key === "education" ? entry.organization : entry.title;
                const secondary = key === "education" ? entry.title : entry.organization;
                return (
                  <div key={entry.id} className="resume-entry">
                    <div className="resume-entry-heading">
                      <div className="resume-entry-row">
                        <h4>{primary.trim() || secondary}</h4>
                        {entry.dates.trim() && <p className="resume-dates">{entry.dates}</p>}
                      </div>
                      {primary.trim() && secondary.trim() && <p className="resume-organization">{secondary}</p>}
                    </div>
                    {bullets.length > 0 && (
                      <ul className="resume-bullets">
                        {bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </section>
          ) : null;
        })}
        {resume.skills.trim() && (
          <section className="resume-section">
            <h3>Technical Skills</h3>
            <div className="resume-skills">
              {resume.skills.split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
                const colon = line.indexOf(":");
                return <p key={index}>{colon > 0 ? <><strong>{line.slice(0, colon + 1)}</strong>{line.slice(colon + 1)}</> : line}</p>;
              })}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
