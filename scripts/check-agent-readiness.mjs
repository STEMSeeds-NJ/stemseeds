import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(resolve(root, file), "utf8");
const fail = (message) => {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
};

const markdown = await read("index.md");
const notFoundMarkdown = await read("404.md");
const instructions = await read("llms.txt");
if (markdown.trim().length === 0) fail("index.md must not be empty.");
if (notFoundMarkdown.trim().length < 20) fail("404.md must explain the missing page in at least 20 characters.");
if (!instructions.includes("## When to use STEMSeeds") || !instructions.includes("## How an agent should call STEMSeeds")) {
  fail("llms.txt is missing concrete agent when-to-use guidance.");
}
for (const page of ["about.html", "contact.html", "privacy.html"]) {
  const html = await read(page);
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length < 500) fail(`${page} must contain at least 500 characters of page content.`);
}

const homepage = await read("index.html");
const organization = homepage.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/)?.[1];
if (!organization) {
  fail("Homepage is missing JSON-LD.");
} else {
  const graph = JSON.parse(organization)["@graph"];
  const org = graph.find((item) => Array.isArray(item["@type"]) ? item["@type"].includes("EducationalOrganization") : item["@type"] === "Organization");
  if (!org?.address?.streetAddress || !org?.address?.addressLocality || !org?.address?.postalCode) {
    fail("Organization JSON-LD is missing a complete postal address.");
  }
  if (!org?.contactPoint?.email || !org?.contactPoint?.contactType) {
    fail("Organization JSON-LD is missing a complete contact point.");
  }
}
console.log("STEMSeeds agent-readiness checks passed.");
