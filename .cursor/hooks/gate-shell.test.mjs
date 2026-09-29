import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "gate-shell.mjs");

function run(command) {
  const result = spawnSync(process.execPath, [script], {
    input: JSON.stringify({ command }),
    encoding: "utf8",
  });
  return result;
}

function assertPermission(command, expected) {
  const result = run(command);
  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), { permission: expected });
}

describe("gate-shell", () => {
  it("denies git push --force", () => {
    assertPermission("git push --force", "deny");
  });

  it("denies git reset --hard", () => {
    assertPermission("git reset --hard", "deny");
  });

  it("denies rm -rf src", () => {
    assertPermission("rm -rf src", "deny");
  });

  it("denies Remove-Item -Recurse src", () => {
    assertPermission("Remove-Item -Recurse src", "deny");
  });

  it("allows composer test", () => {
    assertPermission("composer test", "allow");
  });

  it("allows npm run lint", () => {
    assertPermission("npm run lint", "allow");
  });

  it("allows rm -rf dist", () => {
    assertPermission("rm -rf dist", "allow");
  });

  it("allows git status", () => {
    assertPermission("git status", "allow");
  });
});
