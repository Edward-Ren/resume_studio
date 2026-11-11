"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  initialResume, isResumeData, STORAGE_KEY,
  type EntryField, type PersonalField, type ResumeData, type SectionKey,
} from "./resume-data";
import { resumeTemplates, type ResumeTemplateId } from "./templates";

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

export default function ResumeEditor() {
  const [templateId, setTemplateId] = useState<ResumeTemplateId>(resumeTemplates[0].id);
  const selectedTemplate = resumeTemplates.find((template) => template.id === templateId) ?? resumeTemplates[0];
  const Template = selectedTemplate.component;
  const [editor, setEditor] = useState<EditorState>({
    resume: initialResume, ready: false, canSave: false, status: "Loading saved resume…",
  });
  const { resume, ready, status } = editor;

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
    <main className="resume-editor min-h-screen bg-gray-100 px-4 py-6 text-gray-900 sm:px-6 lg:py-8">
      <header className="resume-no-print mx-auto mb-8 max-w-7xl">
        <Link href="/" className="rounded text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4">
          Resume Studio.
        </Link>
      </header>
      <div className="resume-layout mx-auto grid max-w-7xl items-start gap-8 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section aria-labelledby="editor-heading" className="resume-no-print min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
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

        <section aria-labelledby="preview-heading" className="resume-preview-panel min-w-0">
          <div className="resume-no-print mb-3 flex flex-wrap items-center justify-between gap-4">
            <h2 id="preview-heading" className="text-sm font-semibold">Live preview</h2>
            <span className="text-xs text-gray-500">A4 · 210 × 297 mm</span>
          </div>
          <div className="resume-no-print mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1 basis-48">
                <label htmlFor="resume-template" className="mb-1.5 block text-xs font-medium text-gray-600">
                  Template
                </label>
                <select id="resume-template" value={templateId}
                  onChange={(event) => {
                    const template = resumeTemplates.find((item) => item.id === event.target.value);
                    if (template) setTemplateId(template.id);
                  }}
                  className={fieldClassName}>
                  {resumeTemplates.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                </select>
              </div>
              <button type="button" disabled={!ready} onClick={() => window.print()}
                className="rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50">
                Download PDF
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-gray-500">
              Choose Save as PDF, A4 paper, and 100% scale. Turn off browser headers and footers.
            </p>
          </div>
          <Template resume={resume} />
          <p className="resume-no-print mt-3 text-xs leading-5 text-gray-500">
            Longer resumes continue onto additional pages when printed.
            {" "}Design inspired by <a href={selectedTemplate.sourceUrl} className="underline">{selectedTemplate.name}</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
