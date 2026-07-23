#!/usr/bin/env node
// Fails the build if any generated page has zero or more than one <h1>,
// or an <h1> that is empty/whitespace-only.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

const failures = [];

for (const file of walk(DIST)) {
  const html = readFileSync(file, 'utf8');
  const matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  const rel = relative(DIST, file);

  if (matches.length === 0) {
    failures.push(`${rel}: zero <h1> elements`);
    continue;
  }
  if (matches.length > 1) {
    failures.push(`${rel}: ${matches.length} <h1> elements (expected exactly 1)`);
    continue;
  }
  const text = matches[0][1].replace(/<[^>]*>/g, '').trim();
  if (!text) {
    failures.push(`${rel}: <h1> is empty or whitespace-only`);
  }
}

if (failures.length) {
  console.error('H1 check failed:\n' + failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}

console.log(`H1 check passed (${walk(DIST).length} pages, exactly one non-empty <h1> each).`);
