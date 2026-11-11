import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Studio",
  description: "Build a professional resume with a live preview and PDF download.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
