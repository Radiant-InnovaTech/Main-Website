#!/usr/bin/env node
// Checks the public pages before they are published. Run: node scripts/check-site.js
// It fails (exit 1) if any page still has a [[placeholder]], is waiting for legal review, makes a claim we have
// decided not to make, links to a page or file that does not exist, or lacks a title, description or single h1.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'public-site');
const BANNED = [
  'In-VPC', 'in-VPC', 'WORM', 'HIPAA', 'HSM-', 'constellation', 'Constellation', 'reasoning core', 'operational intelligence',
  'persistent operational memory', 'Blueprint Demo', '<1 min', '< 1 min', 'under 60 seconds', '97.3%', '1.2M events', 'SOC 2 Type II',
  'military-grade', 'seamless', 'cutting-edge', 'world-class', 'Radiant Nexus',
];
const failures = { placeholders: [], legal: [], claims: [], links: [], structure: [], voice: [] };

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const rel = (p) => path.relative(ROOT, p);
const files = walk(ROOT);
const pages = files.filter((f) => f.endsWith('.html'));
const texts = files.filter((f) => /\.(html|txt|xml)$/.test(f));

function resolves(href) {
  let h = href.split('#')[0].split('?')[0];
  if (!h || h.startsWith('/api/') || h.startsWith('/admin')) return true;
  const target = h.endsWith('/') ? path.join(ROOT, h, 'index.html') : path.join(ROOT, h);
  return fs.existsSync(target);
}

for (const f of texts) {
  const t = fs.readFileSync(f, 'utf8');
  if (/\[\[/.test(t)) failures.placeholders.push(`${rel(f)}: ${(t.match(/\[\[/g) || []).length} placeholder(s) left`);
  if (/LEGAL-REVIEW-PENDING/.test(t)) failures.legal.push(`${rel(f)}: waiting for legal review`);
  for (const b of BANNED) {
    // llms.txt may say the product was previously called Radiant Nexus
    if (b === 'Radiant Nexus' && f.endsWith('llms.txt')) continue;
    if (t.includes(b)) failures.claims.push(`${rel(f)}: contains "${b}"`);
  }
  if (f.endsWith('.html') && /—/.test(t)) failures.voice.push(`${rel(f)}: contains an em dash`);
}

for (const f of pages) {
  if (f.includes(`${path.sep}admin${path.sep}`)) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (!/<title>[^<]{5,}<\/title>/.test(t)) failures.structure.push(`${rel(f)}: missing title`);
  if (!/<meta name="description" content="[^"]{30,}"/.test(t)) failures.structure.push(`${rel(f)}: missing meta description`);
  const h1 = (t.match(/<h1[ >]/g) || []).length;
  if (h1 !== 1) failures.structure.push(`${rel(f)}: ${h1} h1 elements (want 1)`);
  for (const m of t.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    if (!resolves(m[1])) failures.links.push(`${rel(f)}: ${m[1]} does not exist`);
  }
  for (const m of t.matchAll(/href="#"/g)) failures.links.push(`${rel(f)}: a link goes to #`);
}

let bad = 0;
for (const [k, list] of Object.entries(failures)) {
  if (!list.length) { console.log(`ok    ${k}`); continue; }
  bad += list.length;
  console.log(`FAIL  ${k}`);
  for (const l of list) console.log(`        ${l}`);
}
console.log(bad ? `\n${bad} problem(s). Fix them before publishing.` : '\nAll checks passed.');
process.exit(bad ? 1 : 0);
