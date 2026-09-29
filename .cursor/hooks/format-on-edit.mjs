#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

function readInput() {
  const raw = readFileSync(0, "utf8");
  return JSON.parse(raw);
}

function isUnderFront(filePath) {
  const normalized = String(filePath).replace(/\\/g, "/");
  const segments = normalized.split("/");
  return segments.includes("front");
}

const input = readInput();
const filePath = String(input.file_path ?? "");

if (!isUnderFront(filePath)) {
  process.exit(0);
}

const prettierBin = process.env.PRETTIER_BIN;
const isWin = process.platform === "win32";

if (prettierBin) {
  spawnSync(prettierBin, [filePath], {
    stdio: "inherit",
    shell: isWin,
  });
} else {
  spawnSync("npx", ["prettier", "--write", filePath], {
    stdio: "inherit",
    shell: isWin,
  });
}

process.exit(0);
