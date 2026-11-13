"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MAX_PHOTO_LENGTH } from "./resume-data";

async function resizePhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
    throw new Error("Choose a JPEG, PNG or WebP image under 10 MB.");
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not resize this photo.");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.5]) {
      const photo = canvas.toDataURL("image/jpeg", quality);
      if (photo.length <= MAX_PHOTO_LENGTH) return photo;
    }
    throw new Error("This photo is too detailed to save. Choose a smaller image.");
  } finally {
    bitmap.close();
  }
}

export function ProfilePhoto({ photo, onChange }: { photo?: string; onChange: (photo?: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const change = useRef(onChange);
  useEffect(() => { change.current = onChange; }, [onChange]);
  useEffect(() => () => { generation.current++; }, []);

  return (
    <div className="space-y-2">
      <label htmlFor="profile-photo" className="block text-sm font-medium">Profile photo (optional)</label>
      {photo && <Image src={photo} alt="Your profile photo" width={64} height={64} unoptimized className="h-16 w-16 rounded-lg object-cover" />}
      <input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy}
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-gray-300 file:bg-white file:px-3 file:py-2"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          const current = ++generation.current;
          setBusy(true);
          setError("");
          try {
            const resized = await resizePhoto(file);
            if (current === generation.current) change.current(resized);
          } catch (cause) {
            if (current === generation.current) setError(cause instanceof Error ? cause.message : "Could not read this photo.");
          } finally {
            if (current === generation.current) setBusy(false);
          }
        }} />
      {photo && <button type="button" className="text-sm underline" onClick={() => {
        generation.current++;
        setBusy(false);
        setError("");
        onChange(undefined);
      }}>Remove photo</button>}
      <p className="text-xs leading-5 text-gray-500">{busy ? "Resizing photo…" : "Choose another image to replace it. Saved in this browser; shown only in templates with a photo layout."}</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
