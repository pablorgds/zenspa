import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "format-on-edit.mjs");

describe("format-on-edit", () => {
  let tmpDir;
  let recorder;
  let recordFile;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "format-on-edit-"));
    recordFile = path.join(tmpDir, "record.txt");
    recorder = path.join(tmpDir, "prettier-recorder.cmd");
    fs.writeFileSync(
      recorder,
      `@echo off\r\necho %*>>"${recordFile}"\r\n`,
      "utf8",
    );
    fs.writeFileSync(recordFile, "", "utf8");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function run(filePath) {
    return spawnSync(process.execPath, [script], {
      input: JSON.stringify({ file_path: filePath }),
      encoding: "utf8",
      env: { ...process.env, PRETTIER_BIN: recorder },
    });
  }

  it("invokes prettier for a path under front/", () => {
    const target = "front/src/App.jsx";
    const result = run(target);
    assert.equal(result.status, 0);
    const recorded = fs.readFileSync(recordFile, "utf8").trim();
    assert.ok(recorded.includes(target), `expected record to include ${target}, got: ${recorded}`);
  });

  it("does not invoke prettier for a path under back/", () => {
    const result = run("back/app/Models/User.php");
    assert.equal(result.status, 0);
    const recorded = fs.readFileSync(recordFile, "utf8").trim();
    assert.equal(recorded, "");
  });
});
