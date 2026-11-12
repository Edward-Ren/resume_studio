import { mkdir, mkdtemp, writeFile, copyFile, chmod, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const version = "0.15.1";
const arch = { x64: "x86_64", arm64: "aarch64" }[process.arch];
const platform = { win32: "pc-windows-msvc", darwin: "apple-darwin", linux: "unknown-linux-musl" }[process.platform];
if (!arch || !platform) throw new Error("Install Typst 0.15.1 manually and set TYPST_BIN on this platform.");
const name = `typst-${arch}-${platform}`;
const extension = process.platform === "win32" ? "zip" : "tar.xz";
const binary = process.platform === "win32" ? "typst.exe" : "typst";
const temp = await mkdtemp(path.join(tmpdir(), "resume-typst-"));
try {
  const response = await fetch(`https://github.com/typst/typst/releases/download/v${version}/${name}.${extension}`);
  if (!response.ok) throw new Error(`Typst download failed: ${response.status}`);
  const archive = path.join(temp, `typst.${extension}`);
  await writeFile(archive, new Uint8Array(await response.arrayBuffer()));
  execFileSync("tar", ["-xf", archive, "-C", temp], { windowsHide: true });
  await mkdir(".typst", { recursive: true });
  await copyFile(path.join(temp, name, binary), path.join(".typst", binary));
  if (process.platform !== "win32") await chmod(path.join(".typst", binary), 0o755);
  console.log(`Installed official Typst ${version} in .typst/`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
