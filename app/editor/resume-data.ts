export interface ResumeEntry {
  id: string;
  title: string;
  organization: string;
  dates: string;
  description: string;
}

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  photo?: string;
  education: ResumeEntry[];
  experience: ResumeEntry[];
  projects: ResumeEntry[];
  skills: string;
}

export type SectionKey = "education" | "experience" | "projects";
export type EntryField = Exclude<keyof ResumeEntry, "id">;
export type PersonalField = "name" | "email" | "phone" | "location" | "skills";

export const STORAGE_KEY = "resume-studio:resume:v1";
export const MAX_PHOTO_LENGTH = 200_000;

export const initialResume: ResumeData = {
  name: "Alex Morgan",
  email: "alex@example.com",
  phone: "+1 (202) 555-0142",
  location: "Sample City, USA",
  education: [{
    id: "example-education",
    title: "BS in Computer Science",
    organization: "Example University",
    dates: "2020 – 2024",
    description: "Coursework: Data Structures, Algorithms, Software Engineering",
  }],
  experience: [{
    id: "example-experience",
    title: "Software Engineer",
    organization: "Example Company",
    dates: "2024 – Present",
    description: "• Build accessible interfaces with React and TypeScript.\n• Collaborate with designers and engineers to deliver features.\n• Write automated tests and review code with the team.",
  }],
  projects: [{
    id: "example-project",
    title: "Task Tracker",
    organization: "Personal project",
    dates: "2024",
    description: "• Built a responsive React and TypeScript app to organize daily tasks.\n• Added filtering and local storage to save progress.",
  }],
  skills: "Languages: TypeScript, JavaScript, Python, SQL\nFrontend: React, HTML, CSS, Tailwind CSS\nTools: Git, Node.js, automated testing",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Validate browser data before trusting it as typed application state.
export function isResumeData(value: unknown): value is ResumeData {
  if (!isRecord(value)) return false;
  if (value.photo !== undefined && (typeof value.photo !== "string" ||
    value.photo.length > MAX_PHOTO_LENGTH || !/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(value.photo))) return false;
  if (!["name", "email", "phone", "location", "skills"].every(
    (field) => typeof value[field] === "string",
  )) return false;

  return ["education", "experience", "projects"].every((section) => {
    const entries = value[section];
    if (!Array.isArray(entries)) return false;
    const ids = new Set<string>();
    return entries.every((entry: unknown) => {
      if (!isRecord(entry) || typeof entry.id !== "string" || !entry.id.trim()) return false;
      if (ids.has(entry.id)) return false;
      ids.add(entry.id);
      return ["title", "organization", "dates", "description"].every(
        (field) => typeof entry[field] === "string",
      );
    });
  });
}

export function hasEntryContent(entry: ResumeEntry): boolean {
  return [entry.title, entry.organization, entry.dates, entry.description].some(
    (value) => value.trim().length > 0,
  );
}
