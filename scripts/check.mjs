// Checks the built site in _site before it goes live (run after `npm run build`;
// the deploy workflow runs it too, and stops if it fails):
// - every link and image on our own pages points at a file that exists,
//   and every #anchor at an id on the page it points to;
// - no template code was left unrendered;
// - the addresses that shipped apps and App Store listings still use exist.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, sep } from "node:path";

const site = resolve("_site");
const problems = [];

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

// The file GitHub Pages would serve for a site path, or null.
function target(path) {
  const file = join(site, decodeURIComponent(path));
  if (path.endsWith("/")) return existsSync(join(file, "index.html")) ? join(file, "index.html") : null;
  if (existsSync(file) && statSync(file).isFile()) return file;
  if (existsSync(join(file, "index.html"))) return join(file, "index.html");
  if (existsSync(file + ".html")) return file + ".html";
  return null;
}

const ids = new Map();
function idsOf(file) {
  if (!ids.has(file)) ids.set(file, new Set([...readFileSync(file, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file);
}

const pages = files(site).filter((file) => file.endsWith(".html"));
for (const file of pages) {
  const html = readFileSync(file, "utf8");
  const here = "/" + relative(site, file).split(sep).join("/");
  if (/\{\{|\{%/.test(html.replace(/<script[\s\S]*?<\/script>/g, ""))) problems.push(`${here}: unrendered template code`);

  for (const [, attr, url] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    if (/^(https?:|mailto:|tel:|data:)/.test(url) || url === "") continue;
    const [pathPart, hash] = url.split("#");
    const absolute = pathPart === "" ? here : new URL(pathPart, "https://x" + here).pathname;
    const found = target(absolute);
    if (!found) { problems.push(`${here}: ${attr}="${url}" points at nothing`); continue; }
    if (hash && found.endsWith(".html") && !idsOf(found).has(hash)) problems.push(`${here}: ${attr}="${url}" has no id="${hash}" there`);
  }

  // Full addresses of this site (canonical links, link-preview images).
  for (const [, url] of html.matchAll(/"https:\/\/lunabitlabs\.com(\/[^"#]*)?(?:#[^"]*)?"/g)) {
    if (!target(url || "/")) problems.push(`${here}: https://lunabitlabs.com${url || ""} points at nothing`);
  }
}

// Addresses in shipped apps, App Store listings and old links. Each must keep working.
const kept = [
  "/tiqan/", "/tiqan/privacy/",
  "/miqat/", "/miqat/privacy/",
  "/thaqib/", "/thaqib/terms/", "/thaqib/privacy/",
  "/miqdar/", "/miqdar/privacy/",
  "/404.html", "/sitemap.xml", "/robots.txt",
];
for (const path of kept) if (!target(path)) problems.push(`missing ${path}`);
for (const [page, id] of [["/thaqib/terms/", "terms"], ["/thaqib/terms/", "terms-ar"], ["/thaqib/privacy/", "privacy"], ["/thaqib/privacy/", "privacy-ar"]]) {
  const file = target(page);
  if (file && !idsOf(file).has(id)) problems.push(`${page} lost id="${id}" (the App Store description links to it)`);
}

if (problems.length) {
  console.error(`${problems.length} problem(s):\n` + problems.map((p) => "  " + p).join("\n"));
  process.exit(1);
}
console.log(`Checked ${pages.length} pages: every link and image resolves.`);
