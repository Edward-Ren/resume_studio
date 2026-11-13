import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const templates = ["readable-classic", "academicv", "modern-cv", "cobalt-cv", "typographic-resume", "vivid-cv", "toy-cv", "altacv", "neat-cv", "rasko-europass"];
const entry = { id: "one", title: "Engineer", organization: "Example", dates: "2024 – Present", description: "• Delivered features\n• Reviewed code" };
const normal = { name: "Alex Morgan", email: "alex@example.com", phone: "+1 202 555 0142", location: "Sample City", education: [entry], experience: [entry], projects: [entry], skills: "Languages: TypeScript\nUncategorized skill" };
const empty = { name: "", email: "", phone: "", location: "", education: [], experience: [], projects: [], skills: "" };
const photo = `data:image/jpeg;base64,${readFileSync(new URL("../typst/packages/preview/vivid-cv/0.2.0/example/photo.jpg", import.meta.url)).toString("base64")}`;
const special = { ...empty, name: 'Zoë #read("secret") [text] $100 \\u0041', experience: [{ ...entry, title: "", organization: "", dates: "", description: '#panic("must remain literal")\nQuotes " \\ * _ @ < > & é' }] };
const long = { ...normal, experience: Array.from({ length: 24 }, (_, i) => ({ ...entry, id: String(i), title: `Role ${i}`, description: `${entry.description}\n${"Long description with wrapping text. ".repeat(12)}` })) };
const render = (body) => fetch(`${base}/api/resume`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

for (const template of templates) {
  test(`${template}: normal, empty, literal text, multi-page data and photo`, async () => {
    for (const resume of [normal, empty, special, long, { ...normal, photo }]) {
      const response = await render({ template, resume });
      assert.equal(response.status, 200, await response.clone().text().then((v) => v.slice(0, 250)));
      assert.equal(response.headers.get("content-type"), "application/pdf");
      assert.equal(response.headers.get("cache-control"), "no-store");
      const pdf = Buffer.from(await response.arrayBuffer());
      assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
      assert.ok(pdf.length > 1000);
    }
  });
}

test("reject invalid data and unregistered template paths", async () => {
  for (const body of [{ template: "../secret", resume: normal }, { template: templates[0], resume: {} }, null]) {
    assert.equal((await render(body)).status, 400);
  }
  assert.equal((await render({ template: templates[0], resume: { ...normal, skills: "x".repeat(200_001) } })).status, 413);
  for (const photo of [null, "https://example.com/photo.jpg", "data:image/svg+xml;base64,AAAA", "data:image/jpeg;base64," + "A".repeat(200_001)]) {
    assert.equal((await render({ template: templates[0], resume: { ...normal, photo } })).status, 400);
  }
});
