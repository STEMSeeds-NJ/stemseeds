import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "index.html", "forms.html", "404.html", "about.html", "contact.html", "privacy.html",
  "science-explorers.html", "tech-innovators.html", "engineering-builders.html", "math-masters.html",
  "stem-tutoring-new-jersey.html", "student-led-peer-tutoring-new-jersey.html",
  "coding-robotics-kids-new-jersey.html", "school-stem-partnerships-new-jersey.html", "updates.html",
  "robots.txt", "sitemap.xml", "llms.txt", "index.md", "404.md",
  "site.webmanifest", "favicon.ico", "favicon.svg", "favicon-96x96.png",
  "apple-touch-icon.png", "web-app-manifest-192x192.png",
  "web-app-manifest-512x512.png", "logo.png", "assets/css/styles.css",
  "assets/js/main.js"
];

const fail = (message) => {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
};

for (const file of required) {
  if (!existsSync(resolve(root, file))) fail(`Missing required file: ${file}`);
}

const read = (file) => readFile(resolve(root, file), "utf8");
const homepage = await read("index.html");
const manifest = JSON.parse(await read("site.webmanifest"));
const sitemap = await read("sitemap.xml");
const robots = await read("robots.txt");

if ((homepage.match(/<h1\b/gi) ?? []).length !== 1) fail("Homepage must contain exactly one H1.");
const contentPages = [
  "index.html", "forms.html", "about.html", "contact.html", "privacy.html",
  "science-explorers.html", "tech-innovators.html", "engineering-builders.html", "math-masters.html",
  "stem-tutoring-new-jersey.html", "student-led-peer-tutoring-new-jersey.html",
  "coding-robotics-kids-new-jersey.html", "school-stem-partnerships-new-jersey.html", "updates.html"
];
for (const page of contentPages) {
  const html = await read(page);
  if (!/<link rel="canonical" href="https:\/\/stemseeds\.org\//i.test(html)) fail(`${page} is missing the canonical URL.`);
}
for (const icon of manifest.icons ?? []) {
  if (!existsSync(resolve(root, icon.src.replace(/^\//, "")))) fail(`Missing manifest icon: ${icon.src}`);
}
if (!robots.includes("Sitemap: https://stemseeds.org/sitemap.xml")) fail("robots.txt has an invalid sitemap URL.");
if (!sitemap.includes("<loc>https://stemseeds.org/</loc>") || !sitemap.includes("<loc>https://stemseeds.org/forms.html</loc>") ||
    !sitemap.includes("<loc>https://stemseeds.org/about.html</loc>") ||
    !sitemap.includes("<loc>https://stemseeds.org/contact.html</loc>") ||
    !sitemap.includes("<loc>https://stemseeds.org/privacy.html</loc>") ||
    !sitemap.includes("<loc>https://stemseeds.org/llms.txt</loc>")) {
  fail("sitemap.xml is missing a current page.");
}

const localReferences = /(?:src|href)="([^"]+)"/g;
const sitePages = ["index.html", "forms.html", "404.html", ...contentPages.filter((page) => page !== "index.html" && page !== "forms.html")];
const pageIds = new Map();
for (const page of sitePages) {
  const html = await read(page);
  pageIds.set(page, new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])));
  for (const match of html.matchAll(localReferences)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|\/|\/\/|data:)/i.test(reference)) continue;
    const [rawFile, fragment] = reference.split("#");
    const file = rawFile.split("?")[0];
    const targetPage = file || page;
    if (fragment && pageIds.has(targetPage) && !pageIds.get(targetPage).has(fragment)) {
      fail(`${page} references missing fragment: ${reference}`);
    }
    if (file && !existsSync(resolve(root, dirname(page), file))) fail(`${page} references missing local file: ${reference}`);
  }
}

const ids = [...homepage.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
if (new Set(ids).size !== ids.length) fail("Homepage contains duplicate IDs.");

for (const page of contentPages) {
  const html = await read(page);
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (page !== "updates.html" && text.length < 450) fail(`${page} does not contain enough substantive content.`);
  if (!/<link rel="canonical" href="https:\/\/stemseeds\.org\/[^"]*">/i.test(html)) fail(`${page} is missing a canonical URL.`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch (error) { fail(`${page} contains invalid JSON-LD: ${error.message}`); }
  }
}
console.log("STEMSeeds Node site checks passed.");
