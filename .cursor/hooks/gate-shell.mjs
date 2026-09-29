#!/usr/bin/env node
import { readFileSync } from "node:fs";

const BUILD_SEGMENTS = new Set(["dist", "build", "node_modules"]);

function readInput() {
  const raw = readFileSync(0, "utf8");
  return JSON.parse(raw);
}

function respond(permission) {
  process.stdout.write(JSON.stringify({ permission }));
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

const input = readInput();
const command = String(input.command ?? "");

if (command.includes("git push --force") || command.includes("git reset --hard")) {
  respond("deny");
}

if (isRecursiveDelete(command)) {
  const targets = extractRecursiveTargets(command);
  if (targets.length === 0 || targets.some((t) => !isBuildDirectory(t))) {
    respond("deny");
  }
}

respond("allow");
