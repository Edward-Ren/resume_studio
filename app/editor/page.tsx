"use client";

import { Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  initialResume, isResumeData, STORAGE_KEY,
  type EntryField, type PersonalField, type ResumeData, type SectionKey,
} from "./resume-data";
import { resumeTemplates } from "./templates";
import { useTypstPreview } from "./templates/use-typst-preview";
import { ResumePreview } from "./templates/resume-preview";
import { ProfilePhoto } from "./profile-photo";

const contactFields = [
  { key: "name", label: "Full name", type: "text", autoComplete: "name" },
  { key: "email", label: "Email", type: "email", autoComplete: "email" },
  { key: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { key: "location", label: "Location", type: "text", autoComplete: "address-level2" },
] as const;

const resumeSections = [
  { key: "education", label: "Education", titleLabel: "Degree / qualification", organizationLabel: "School / university" },
  { key: "experience", label: "Work Experience", titleLabel: "Job title", organizationLabel: "Company" },
  { key: "projects", label: "Projects", titleLabel: "Project title", organizationLabel: "Organization / context" },
] as const;

const fieldClassName = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm leading-6 text-gray-900 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-200";
const buttonClassName = "rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50";

interface EditorState {
  resume: ResumeData;
  ready: boolean;
  canSave: boolean;
  status: string;
}

function ResumeEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedTemplate = resumeTemplates.find((template) => template.id === searchParams.get("template")) ?? resumeTemplates[0];
  const templateId = selectedTemplate.id;
  const [editor, setEditor] = useState<EditorState>({
    resume: initialResume, ready: false, canSave: false, status: "Loading saved resume…",
  });
  const { resume, ready, status } = editor;
  const pdf = useTypstPreview(templateId, resume, ready);
  const isTypst = templateId !== "jake";
  const [zoom, setZoom] = useState("page");
  const [scale, setScale] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const previewPanel = useRef<HTMLElement>(null);
  const previewScroll = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const changed = () => setFullscreen(document.fullscreenElement === previewPanel.current);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setFullscreen(false); };
    document.addEventListener("fullscreenchange", changed);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("fullscreenchange", changed);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  async function toggleFullscreen() {
    if (fullscreen) {
      setFullscreen(false);
      if (document.fullscreenElement) await document.exitFullscreen();
    } else {
      setFullscreen(true);
      // The viewport overlay also works where browser fullscreen is unavailable.
      await previewPanel.current?.requestFullscreen?.().catch(() => {});
    }
  }

  function adjustZoom(direction: number) {
    const page = previewScroll.current?.querySelector<HTMLElement>(".resume-pdf-page, .resume-sheet-container");
    if (!page) return;
    const naturalWidth = parseFloat(page.style.getPropertyValue("--page-width")) || 210 * 96 / 25.4;
    const current = page.getBoundingClientRect().width / naturalWidth;
    setScale(Math.min(3, Math.max(0.25, Math.round((current + direction * 0.1) * 100) / 100)));
    setZoom("actual");
  }

  useEffect(() => {
    const panel = previewScroll.current!;
    panel.scrollTo(0, 0);
    const resize = () => {
      panel.style.setProperty("--preview-width", `${panel.clientWidth - 16}px`);
      panel.style.setProperty("--preview-height", `${panel.clientHeight - 16}px`);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(panel);
    resize();
    return () => observer.disconnect();
  }, [templateId]);

  function downloadPdf() {
    if (!isTypst) return window.print();
    if (!pdf.url) return;
    const link = document.createElement("a");
    link.href = pdf.url;
    link.download = `resume-${templateId}.pdf`;
    link.click();
  }

  useEffect(() => {
    let loaded: EditorState = {
      resume: initialResume, ready: true, canSave: true,
      status: "Changes save automatically in this browser.",
    };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed: unknown = JSON.parse(saved);
        if (!isResumeData(parsed)) throw new Error("Invalid saved resume");
        loaded = { ...loaded, resume: parsed, status: "Saved resume restored. Changes save automatically." };
      }
    } catch {
      // Preserve unreadable saved data instead of replacing it with examples.
      loaded = { ...loaded, canSave: false, status: "Saved data could not be loaded. You can edit, but auto-save is disabled to preserve existing data." };
    }
    // Browser storage is only available after mounting; keep server/client initial output identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditor(loaded);
  }, []);

  // Save on edits only, never during initialization or inside a state updater.
  function updateResume(next: ResumeData) {
    if (!ready) return;
    let nextStatus = status;
    if (editor.canSave) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        nextStatus = "All changes saved in this browser.";
      } catch {
        nextStatus = "Changes could not be saved. Keep this page open to retain your edits.";
      }
    }
    setEditor({ ...editor, resume: next, status: nextStatus });
  }

  function updateField(field: PersonalField, value: string) {
    updateResume({ ...resume, [field]: value });
  }

  function updateEntry(section: SectionKey, id: string, field: EntryField, value: string) {
    updateResume({
      ...resume,
      [section]: resume[section].map((entry) => entry.id === id ? { ...entry, [field]: value } : entry),
    });
  }

  function addEntry(section: SectionKey) {
    updateResume({
      ...resume,
      [section]: [...resume[section], { id: crypto.randomUUID(), title: "", organization: "", dates: "", description: "" }],
    });
  }

  function deleteEntry(section: SectionKey, id: string) {
    updateResume({ ...resume, [section]: resume[section].filter((entry) => entry.id !== id) });
  }

  return (
    <main className="resume-editor min-h-screen bg-gray-100 px-4 py-5 text-gray-900 sm:px-6">
      <header className="resume-editor-header resume-no-print mx-auto mb-3 flex w-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="rounded text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4">
          Resume Studio.
        </Link>
        <button type="button" disabled={!ready || (isTypst && !pdf.url)} onClick={downloadPdf}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50">
          Download PDF
        </button>
      </header>
      <div className="resume-layout mx-auto grid max-w-7xl items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section aria-labelledby="editor-heading" className="resume-edit-panel resume-no-print min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h1 id="editor-heading" className="text-2xl font-bold tracking-tight">Edit your resume</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">Your preview updates as you type. Add entries for each qualification, role, or project.</p>
          <p role="status" className="mt-2 text-xs leading-5 text-gray-600">{status}</p>

          <form className="mt-6" onSubmit={(event) => event.preventDefault()}>
            <fieldset disabled={!ready} className="min-w-0 space-y-6 disabled:opacity-60">
              <legend className="sr-only">Resume details</legend>
              <fieldset className="min-w-0 space-y-4">
                <legend className="mb-4 text-sm font-semibold">Personal details</legend>
                {contactFields.map(({ key, label, type, autoComplete }) => (
                  <div key={key}>
                    <label htmlFor={key} className="mb-1.5 block text-sm font-medium">{label}</label>
                    <input id={key} name={key} type={type} autoComplete={autoComplete} value={resume[key]}
                      onChange={(event) => updateField(key, event.target.value)} className={fieldClassName} />
                  </div>
                ))}
                <ProfilePhoto photo={resume.photo} onChange={(photo) => updateResume({ ...resume, photo })} />
              </fieldset>

              <p id="section-hint" className="border-t border-gray-100 pt-5 text-sm leading-6 text-gray-500">
                Use new lines for description bullets. Empty entries and sections are hidden in the preview.
              </p>
              {resumeSections.map(({ key, label, titleLabel, organizationLabel }) => (
                <section key={key} aria-labelledby={`${key}-heading`} className="space-y-4">
                  <h2 id={`${key}-heading`} className="font-semibold">{label}</h2>
                  {resume[key].map((entry, index) => (
                    <fieldset key={entry.id} className="min-w-0 space-y-3 rounded-lg border border-gray-200 p-4">
                      <legend className="px-1 text-sm font-medium">{label} {index + 1}</legend>
                      {([
                        { field: "title", label: titleLabel },
                        { field: "organization", label: organizationLabel },
                        { field: "dates", label: "Dates (e.g. 2024 – Present)" },
                        { field: "description", label: "Description" },
                      ] as const).map(({ field, label: fieldLabel }) => {
                        const inputId = `${key}-${entry.id}-${field}`;
                        return (
                          <div key={field}>
                            <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">{fieldLabel}</label>
                            {field === "description" ? (
                              <textarea id={inputId} rows={4} value={entry[field]} aria-describedby="section-hint"
                                onChange={(event) => updateEntry(key, entry.id, field, event.target.value)}
                                className={`${fieldClassName} resize-y`} />
                            ) : (
                              <input id={inputId} type="text" value={entry[field]}
                                onChange={(event) => updateEntry(key, entry.id, field, event.target.value)} className={fieldClassName} />
                            )}
                          </div>
                        );
                      })}
                      <button type="button" onClick={() => deleteEntry(key, entry.id)}
                        aria-label={`Delete ${label} entry ${index + 1}${entry.title ? `: ${entry.title}` : ""}`}
                        className={`${buttonClassName} text-red-700`}>Delete entry</button>
                    </fieldset>
                  ))}
                  <button type="button" onClick={() => addEntry(key)} className={buttonClassName}>+ Add {label} entry</button>
                </section>
              ))}
              <div>
                <label htmlFor="skills" className="mb-1.5 block text-sm font-medium">Skills</label>
                <textarea id="skills" rows={4} value={resume.skills} onChange={(event) => updateField("skills", event.target.value)}
                  className={`${fieldClassName} resize-y`} />
              </div>
            </fieldset>
          </form>
        </section>

        <section ref={previewPanel} data-fullscreen={fullscreen} aria-label="Live preview" className="resume-preview-panel min-w-0">
          <div key={templateId} ref={previewScroll} data-zoom={zoom}
            style={{ "--preview-scale": scale } as CSSProperties}
            className="resume-preview-scroll" tabIndex={0} role="region" aria-label="Resume pages">
            <ResumePreview template={selectedTemplate} resume={resume} pdf={pdf} />
          </div>
          <div className="resume-preview-toolbar resume-no-print" role="group" aria-label="Preview controls">
            <label htmlFor="resume-template" className="sr-only">Template</label>
            <select id="resume-template" value={templateId} onChange={(event) => {
              const params = new URLSearchParams(searchParams);
              params.set("template", event.target.value);
              router.replace(`/editor?${params}`, { scroll: false });
            }}>
              {resumeTemplates.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
            </select>
            <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => adjustZoom(-1)}>&minus;</button>
            <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => adjustZoom(1)}>+</button>
            <button type="button" aria-pressed={zoom === "page"} onClick={() => {
              setZoom("page");
              previewScroll.current?.scrollTo(0, 0);
            }}>Fit Page</button>
            <button type="button" aria-pressed={zoom === "width"} onClick={() => setZoom("width")}>Fit Width</button>
            <button type="button" aria-label={fullscreen ? "Exit fullscreen preview" : "Fullscreen preview"}
              title={fullscreen ? "Exit fullscreen preview" : "Fullscreen preview"} aria-pressed={fullscreen} onClick={toggleFullscreen}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d={fullscreen ? "M9 3v6H3m18 0h-6V3M3 15h6v6m6 0v-6h6" : "M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6"} />
              </svg>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<p role="status" className="p-6 text-sm text-gray-600">Loading editor…</p>}>
      <ResumeEditor />
    </Suspense>
  );
}
