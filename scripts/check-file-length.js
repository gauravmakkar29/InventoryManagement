/**
 * File Length Checker for lint-staged
 *
 * Enforces file size limits on staged .ts/.tsx files:
 * - >400 lines: warning (printed to stderr)
 * - >600 lines: error (exits with code 1, blocks commit)
 *
 * Usage: node scripts/check-file-length.js <file1> <file2> ...
 * Called automatically by lint-staged on pre-commit.
 */

import { readFileSync } from "fs";
import { relative } from "path";

const WARN_THRESHOLD = 400;
const ERROR_THRESHOLD = 600;

const files = process.argv.slice(2);
let hasError = false;

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const lineCount = content.split("\n").length;
  const relativePath = relative(process.cwd(), file);

  if (lineCount > ERROR_THRESHOLD) {
    console.error(
      `ERROR: ${relativePath} has ${lineCount} lines (max ${ERROR_THRESHOLD}). Refactor before committing.`
    );
    hasError = true;
  } else if (lineCount > WARN_THRESHOLD) {
    console.error(
      `WARNING: ${relativePath} has ${lineCount} lines (recommended max ${WARN_THRESHOLD}). Consider splitting.`
    );
  }
}

if (hasError) {
  process.exit(1);
}
