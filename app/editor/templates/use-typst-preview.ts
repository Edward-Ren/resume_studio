"use client";

import { useEffect, useState } from "react";
import type { ResumeData } from "../resume-data";

export function useTypstPreview(template: string, resume: ResumeData, ready: boolean) {
  const key = JSON.stringify({ template, resume });
  const [result, setResult] = useState({ key: "", url: "", error: "" });
  useEffect(() => {
    if (!ready || template === "jake") return;
    const controller = new AbortController();
    let url = "";
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/resume", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: key, signal: controller.signal,
        });
        if (!response.ok) throw new Error((await response.json()).error || "Could not render resume.");
        const pdf = await response.blob();
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(pdf);
        setResult({ key, url, error: "" });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key, url: "", error: error instanceof Error ? error.message : "Could not render resume." });
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [key, ready, template]);
  // Never allow downloading a PDF compiled from earlier edits or another template.
  return result.key === key ? result : { key, url: "", error: "" };
}
