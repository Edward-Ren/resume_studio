import { execFile } from "node:child_process";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { isResumeData } from "../../editor/resume-data";
import { adaptResume } from "../../editor/templates/typst-data";

const templates = ["readable-classic", "academicv", "modern-cv", "cobalt-cv", "typographic-resume"];

export async function POST(request: Request) {
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 200_000) return Response.json({ error: "Resume is too large (maximum 200,000 characters)." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid resume request." }, { status: 400 });
  }
  if (!body || !templates.includes(body.template) || !isResumeData(body.resume)) {
    return Response.json({ error: "Invalid template or resume data." }, { status: 400 });
  }
  const root = path.join(process.cwd(), "typst");
  try {
    const source = await readFile(path.join(root, "adapters", `${body.template}.typ`), "utf8");
    const data = JSON.stringify(JSON.stringify(adaptResume(body.resume)));
    const { stdout, stderr } = await new Promise<{ stdout: Buffer; stderr: Buffer }>((resolve, reject) => {
      // Assets and the platform binary are explicitly included in next.config.ts.
      const child = execFile(/* turbopackIgnore: true */ process.env.TYPST_BIN || path.join(process.cwd(), ".typst", process.platform === "win32" ? "typst.exe" : "typst"), [
        "compile", "--root", root, "--package-path", path.join(root, "packages"),
        "--font-path", path.join(root, "fonts"),
        "--format", "pdf", "-", "-",
      ], { cwd: root, encoding: "buffer", timeout: 30_000, maxBuffer: 20 * 1024 * 1024, windowsHide: true },
      (error, stdout, stderr) => error ? reject(error) : resolve({ stdout, stderr }));
      child.stdin?.on("error", () => {}); // Spawn/compile failures are handled by the callback.
      child.stdin?.end(`#let data = json(bytes(${data}))\n${source}`);
    });
    if (/unknown font family|does not contain.*glyph/i.test(stderr.toString())) {
      throw new Error(`Required template fonts are missing: ${stderr.toString()}`);
    }
    return new Response(new Uint8Array(stdout), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="resume.pdf"',
      "Cache-Control": "no-store",
    } });
  } catch (error) {
    const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
    const fonts = error instanceof Error && error.message.startsWith("Required template fonts");
    return Response.json({ error: missing
      ? "Typst is not installed. Install Typst 0.15.1 and set TYPST_BIN (see README)."
      : fonts ? "Required template fonts are missing on the server. See typst/README.md."
      : "Typst could not render this resume. Check the server's compiler installation and template assets." }, { status: 503 });
  }
}
