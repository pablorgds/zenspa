#!/usr/bin/env node
import { writeSync } from "node:fs";
import { stdin } from "node:process";

const BUILD_SEGMENTS = new Set(["dist", "build", "node_modules"]);

function respond(permission) {
  writeSync(1, Buffer.from(`${JSON.stringify({ permission })}\n`));
  process.exit(0);
}

function isBuildDirectory(target) {
  const normalized = String(target).replace(/\\/g, "/").replace(/\/+$/, "");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return false;
  const finalSegment = segments[segments.length - 1];
  return BUILD_SEGMENTS.has(finalSegment);
}

function isRecursiveDelete(command) {
  if (command.includes("rm -rf") || command.includes("rm -fr")) return true;
  if (command.includes("Remove-Item") && command.includes("-Recurse")) return true;
  return false;
}

function extractRmTargets(command) {
  let marker = "rm -rf";
  let idx = command.indexOf(marker);
  if (idx === -1) {
    marker = "rm -fr";
    idx = command.indexOf(marker);
  }
  if (idx === -1) return [];
  const rest = command.slice(idx + marker.length).trim();
  if (!rest) return [];
  return rest.split(/\s+/).filter(Boolean);
}

function extractRemoveItemTargets(command) {
  const tokens = command.split(/\s+/).filter(Boolean);
  const targets = [];
  let seen = false;
  for (const token of tokens) {
    if (token === "Remove-Item") {
      seen = true;
      continue;
    }
    if (!seen) continue;
    if (token.startsWith("-")) continue;
    targets.push(token);
  }
  return targets;
}

function extractRecursiveTargets(command) {
  if (command.includes("rm -rf") || command.includes("rm -fr")) {
    return extractRmTargets(command);
  }
  if (command.includes("Remove-Item") && command.includes("-Recurse")) {
    return extractRemoveItemTargets(command);
  }
  return [];
}

function decide(command) {
  if (command.includes("git push --force") || command.includes("git reset --hard")) {
    return "deny";
  }
  if (isRecursiveDelete(command)) {
    const targets = extractRecursiveTargets(command);
    if (targets.length === 0 || targets.some((t) => !isBuildDirectory(t))) {
      return "deny";
    }
  }
  return "allow";
}

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString("utf8"));
    };
    const tryParse = () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) return;
      try {
        JSON.parse(raw);
        finish();
      } catch {
        // Wait for the rest of the object.
      }
    };
    const timer = setTimeout(finish, 2000);
    stdin.on("data", (chunk) => {
      chunks.push(chunk);
      tryParse();
    });
    stdin.on("end", finish);
    stdin.on("error", finish);
    if (stdin.readableEnded) finish();
  });
}

function commandFrom(raw) {
  const text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) return "";
  try {
    const input = JSON.parse(text);
    if (input && typeof input.command === "string") return input.command;
  } catch {
    // Cursor may send a payload JSON.parse rejects. Keep the command field.
  }
  const match = text.match(/"command"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (!match) return "";
  return match[1].replace(/\\"/g, "\"").replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
}

respond(decide(commandFrom(await readStdin())));
