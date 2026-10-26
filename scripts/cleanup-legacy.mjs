// ---------------------------------------------------------------------------
// Legacy-file cleanup — runs before `next build` / `next dev`.
//
// Next.js 16 renamed the "middleware" file convention to "proxy" and HARD
// FAILS the build when both exist:
//
//   Error: Both middleware file "./src/middleware.ts" and proxy file
//   "./src/proxy.ts" are detected. Please use "./src/proxy.ts" only.
//
// Repos updated by copying the new files over an older checkout often keep
// the stale `middleware.ts` behind. This script removes it automatically so
// the build self-heals on CI (Netlify) without a manual repo cleanup.
//
// Zero dependencies. Never fails the build — worst case it logs and exits 0.
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".turbo",
  "dist",
  "coverage",
  "prisma",
  "uploads",
  "db",
  "public",
  "scripts",
]);

const MIDDLEWARE_NAMES = new Set([
  "middleware.ts",
  "middleware.tsx",
  "middleware.js",
  "middleware.mjs",
]);
const PROXY_NAMES = new Set(["proxy.ts", "proxy.tsx", "proxy.js", "proxy.mjs"]);

const middlewareFiles = [];
const proxyFiles = [];
let scanned = 0;
const MAX_FILES = 50_000;

function walk(dir, depth) {
  if (depth > 5 || scanned > MAX_FILES) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (scanned > MAX_FILES) return;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
        walk(full, depth + 1);
      }
      continue;
    }
    scanned += 1;
    if (MIDDLEWARE_NAMES.has(entry.name)) middlewareFiles.push(full);
    else if (PROXY_NAMES.has(entry.name)) proxyFiles.push(full);
  }
}

try {
  walk(process.cwd(), 0);

  if (middlewareFiles.length === 0) {
    process.exit(0);
  }

  if (proxyFiles.length === 0) {
    // Only the legacy file exists — Next.js 16 still runs it with a
    // deprecation warning, so leave it untouched.
    console.log(
      `[cleanup] legacy middleware file(s) found (${middlewareFiles
        .map((f) => relative(process.cwd(), f))
        .join(", ")}) but no proxy file — leaving as-is.`,
    );
    process.exit(0);
  }

  for (const file of middlewareFiles) {
    rmSync(file, { force: true });
    console.log(
      `[cleanup] removed legacy "${relative(process.cwd(), file).split(sep).join("/")}" — Next.js 16 uses "${relative(
        process.cwd(),
        proxyFiles[0],
      )
        .split(sep)
        .join("/")}" instead.`,
    );
  }
} catch (error) {
  console.log(`[cleanup] skipped (non-fatal): ${error?.message ?? error}`);
}

process.exit(0);
