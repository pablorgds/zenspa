# Harness L2 Validation

**Date**: 2026-09-28
**Spec**: `.specs/features/harness-l2/spec.md`
**Diff range**: `16eebfb^..HEAD` (`16eebfb`..`3c5415c`)
**Verifier**: independent sub-agent (author ≠ verifier)
**Scan root**: `C:\Users\Pablo Roberto\Documents\projects\agenda` (not a git repo)
**Porcelain isolation**: baseline captured before sensor; after `git worktree remove --force` baseline matched (`PORCELAIN_MATCH=YES`)

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | `../.gitignore` has `.env`, `.env.*`, `!.env.example` |
| T2 | ✅ Done | `zenspa/.gitignore:26-28`; `check-ignore` reports ignored for `.env.docker`, `front/.env`, `back/.env`; files exist on disk |
| T3 | ✅ Done | `../LICENSE` MIT + `Copyright (c) 2026 ZenSpa` |
| T4 | ✅ Done | `LICENSE` identical MIT text |
| T5 | ✅ Done | `.cursor/mcp.json` empty `mcpServers` |
| T6 | ✅ Done | `.cursor/rules/always.mdc` alwaysApply + three policy lines |
| T7 | ✅ Done | `.cursor/rules/back-php.mdc` glob `back/**/*.php` |
| T8 | ✅ Done | `.cursor/rules/front-jsx.mdc` glob `front/**/*.{js,jsx}` |
| T9 | ✅ Done | `../README.md` names back/front + commands |
| T10 | ✅ Done | `.cursor/commands/verify.md` cites both commands; skills frontmatter kept |
| T11 | ✅ Done | `.cursor/agents/reviewer.md` name/description ≥40, test/lint only |
| T12 | ✅ Done | `../package.json` `scripts.test` + `../package-lock.json` exists |
| T13 | ⚠️ Partial / SPEC_DEVIATION | Original task required `files: []`; HEAD uses `include: []` + `references: []` (see Spec-precision). `strict`/`allowJs`/`noEmit` present |
| T14 | ✅ Done | `front/package.json:11` `typecheck`; live `npm run typecheck` exit 0 |
| T15 | ✅ Done | `front/.prettierrc.json` valid `{}` |
| T16 | ✅ Done | `front/package.json:12` `format`: `prettier` |
| T17 | ✅ Done | `.github/workflows/ci.yml` phpunit + eslint + composer test + npm run lint |
| T18 | ✅ Done | `.husky/pre-commit` + `core.hooksPath=.husky` (live commit probe not re-run) |
| T19 | ✅ Done | `gate-shell.mjs` + 8 tests |
| T20 | ✅ Done | `format-on-edit.mjs` + 2 tests |
| T21 | ✅ Done | `../.cursor/hooks.json` uses `zenspa/.cursor/hooks/...` |
| T22 | ✅ Done | `.cursor/hooks.json` uses `.cursor/hooks/...` |
| T23 | ⚠️ Partial | Done-when boxes checked; Status=Done. Traceability rows still `Implementing` and coverage line still `0 mapped` (overclaim). No persisted harness-score report file; instruction: do not re-run; implementer recorded L2+ (orchestrator note: L4) |

---

## Spec-Anchored Acceptance Criteria

### P1: Contexto

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion / content | Result |
| ------------------------- | -------------------- | --------------------------------- | ------ |
| HS-01 WHEN harness-score in agenda THEN CTX-03..CTX-07 pass | Scanner greens for those checks | Artifact set: `.cursor/rules/*.mdc`, `../README.md:3-6`; T23 marked L2+ at commit `bd59171` (no report file; not re-run) | ✅ PASS |
| HS-02 ≥2 `.mdc` with `description` + `globs` or `alwaysApply` | Two+ rule files with YAML frontmatter | `.cursor/rules/always.mdc:1-3`, `.cursor/rules/back-php.mdc:1-3`, `.cursor/rules/front-jsx.mdc:1-3` | ✅ PASS |
| HS-03 WHILE >1 rule, ≥1 has `globs` and NOT `alwaysApply: true` | Glob-scoped rule without alwaysApply | `.cursor/rules/back-php.mdc:3` `globs: back/**/*.php` (no alwaysApply); `.cursor/rules/front-jsx.mdc:3` same pattern | ✅ PASS |
| HS-04 always-applied rule states .env not staged, tests not weakened, admin `is_admin` | Exact three policies | `.cursor/rules/always.mdc:6` / `:8` / `:10` | ✅ PASS |
| HS-05 one rule `back/**/*.php`, one `front/**/*.{js,jsx}` | Exact globs | `.cursor/rules/back-php.mdc:3`; `.cursor/rules/front-jsx.mdc:3` | ✅ PASS |
| HS-06 IF rule >500 lines THEN split | All rules ≤500 | Line counts: always 10, back-php 6, front-jsx 6 | ✅ PASS |
| HS-07 WHEN scan root agenda THEN `agenda/README.md` names `zenspa/back`, `zenspa/front`, `composer test`, `npm run lint` | Those four strings present | `../README.md:3-6` | ✅ PASS |

### P1: Skills

| Criterion | Spec-defined outcome | `file:line` + assertion / content | Result |
| --------- | -------------------- | --------------------------------- | ------ |
| HS-08 WHEN harness-score THEN SKL-01..SKL-04 pass | Scanner greens | Skills + command artifacts; T23 L2+ record | ✅ PASS |
| HS-09 skills keep YAML `name` + `description` | Frontmatter present | `.cursor/skills/coding-guidelines/SKILL.md:2-3`; `.cursor/skills/tlc-spec-driven/SKILL.md:2-3` | ✅ PASS |
| HS-10 IF description <40 chars THEN SKL-04 fails | Descriptions ≥40 | Both `description` lines exceed 40 characters (coding-guidelines:3; tlc-spec-driven:3) | ✅ PASS |
| HS-11 WHEN project command THEN `.cursor/commands/` has `.md` telling `composer test` in back and `npm run lint` in front | Both commands in body | `.cursor/commands/verify.md:3-5` | ✅ PASS |

### P1: Higiene

| Criterion | Spec-defined outcome | `file:line` + assertion / content | Result |
| --------- | -------------------- | --------------------------------- | ------ |
| HS-12 WHEN harness-score THEN HYG-01,02,03,05,08 pass | Scanner greens | LICENSE, gitignore, mcp artifacts; T23 L2+ record | ✅ PASS |
| HS-13 `agenda/.gitignore` has `.env` / `.env.*` and `!.env.example` | Exact lines | `../.gitignore:1-3` | ✅ PASS |
| HS-14 `zenspa/.gitignore` same three lines | Exact lines | `.gitignore:26-28` | ✅ PASS |
| HS-15 `git check-ignore` on `.env.docker`, `front/.env`, `back/.env` reports ignored | Each path ignored | Live: `.gitignore:27` → `.env.docker`; `.gitignore:26` → `front/.env`; `back/.gitignore:3` → `back/.env` (also covered by root `.env`) | ✅ PASS |
| HS-16 those three env files still exist on disk | Exist after ignore change | Live `Test-Path` True for all three | ✅ PASS |
| HS-17 `agenda/LICENSE` and `zenspa/LICENSE` are MIT text | MIT License text | `../LICENSE:1`; `LICENSE:1` | ✅ PASS |
| HS-18 `mcp.json` valid JSON, `mcpServers` object, no literal secrets | Empty servers object | `.cursor/mcp.json:1-3` `{"mcpServers":{}}` | ✅ PASS |
| HS-19 IF token/key/secret/password/auth key THEN value `${ENV_VAR}` | No such keys present | `.cursor/mcp.json:2` empty object — vacuous pass | ✅ PASS |

### P2: Sensores

| Criterion | Spec-defined outcome | `file:line` + assertion / content | Result |
| --------- | -------------------- | --------------------------------- | ------ |
| HS-20 WHEN harness-score THEN SNS-01,03,04 pass and SNS-02,05 stay green | Scanner greens | package.json/lock, tsconfig, prettier artifacts; T23 L2+ record | ✅ PASS |
| HS-21 `agenda/package.json` `scripts.test` = `composer test --working-dir=zenspa/back` | Exact string | `../package.json:5` | ✅ PASS |
| HS-22 `agenda/package-lock.json` exists beside it | File exists | Live `Test-Path` True | ✅ PASS |
| HS-23 WHEN `composer test --working-dir=zenspa/back` THEN exit 0 | PHPUnit exit 0 | Live `docker exec … composer test`: 47 passed (107 assertions) | ✅ PASS |
| HS-24 `front/tsconfig.json` contains `"strict": true` | Exact key true | `front/tsconfig.json:3` `"strict": true` | ✅ PASS |
| HS-24/T13 empty input set for tsc | Original task: `files: []`; committed: `include: []` + `references: []` | `front/tsconfig.json:7-8`; `tasks.md:462-464` SPEC_DEVIATION (TS18002) | ⚠️ Spec-precision gap / SPEC_DEVIATION |
| HS-25 WHEN `npm run typecheck` in front THEN `tsc --noEmit` exit 0 | Exit 0 | `front/package.json:11`; live exit 0 | ✅ PASS |
| HS-26 `.prettierrc.json` exists; `format` script invokes Prettier | Config + script | `front/.prettierrc.json:1`; `front/package.json:12` `"format": "prettier"` | ✅ PASS |

### P2: CI

| Criterion | Spec-defined outcome | `file:line` + assertion / content | Result |
| --------- | -------------------- | --------------------------------- | ------ |
| HS-27 WHEN harness-score THEN CI-01..CI-04 pass | Scanner greens | workflow + husky artifacts; T23 L2+ record | ✅ PASS |
| HS-28 workflow contains strings `phpunit` and `eslint` | Both substrings | `.github/workflows/ci.yml:19` / `:25` | ✅ PASS |
| HS-29 test step invokes `composer test` or `php artisan test` in back with sqlite from phpunit.xml | No DB override in workflow | `.github/workflows/ci.yml:19-21` `working-directory: back` / `composer test` | ✅ PASS |
| HS-30 lint step invokes `npm run lint` in front | Exact | `.github/workflows/ci.yml:25-27` | ✅ PASS |
| HS-31 `.husky/pre-commit` exists and invokes `npm run lint` in front | Exact | `.husky/pre-commit:2-3` `cd front` / `npm run lint` | ✅ PASS |
| HS-32 WHEN commit after hook install THEN husky pre-commit runs | Hook path configured | Live `git config core.hooksPath` → `.husky`; file `.husky/pre-commit:1-3` (live commit probe not re-executed this verification) | ✅ PASS |

### P2: Hooks

| Criterion | Spec-defined outcome | `file:line` + assertion / content | Result |
| --------- | -------------------- | --------------------------------- | ------ |
| HS-33 WHEN harness-score THEN HKS-01..HKS-05 pass | Scanner greens | dual hooks.json + scripts; T23 L2+ record | ✅ PASS |
| HS-34 `agenda/.cursor/hooks.json` version numeric; beforeShellExecution + afterFileEdit non-empty commands | Valid JSON handlers | `../.cursor/hooks.json:2` / `:6` / `:12` | ✅ PASS |
| HS-35 `zenspa/.cursor/hooks.json` same events, paths relative to zenspa | Relative commands | `.cursor/hooks.json:6` `node .cursor/hooks/gate-shell.mjs`; `:12` format-on-edit | ✅ PASS |
| HS-36 WHEN gate sees force-push / reset --hard / recursive delete outside build THEN deny | permission deny | `.cursor/hooks/gate-shell.test.mjs:24-25` `assertPermission(..., "deny")`; `:28-29`; `:32-33`; `:36-37`; impl `.cursor/hooks/gate-shell.mjs:65-72` | ✅ PASS |
| HS-37 WHEN gate sees `composer test` or `npm run lint` THEN allow | permission allow | `.cursor/hooks/gate-shell.test.mjs:40-41`; `:44-45` | ✅ PASS |
| HS-38 WHEN afterFileEdit under `zenspa/front` THEN Prettier invoked | Recorder includes path | `.cursor/hooks/format-on-edit.test.mjs:40-45` `assert.ok(recorded.includes(target))`; impl `.cursor/hooks/format-on-edit.mjs:19-30` | ✅ PASS |
| HS-39 IF hook command relative path THEN exists from agenda scan root (selected config) and from zenspa workspace | Both resolve | `../.cursor/hooks.json:6` `zenspa/.cursor/hooks/gate-shell.mjs` (not bare `.cursor/hooks/...`); scripts exist under `zenspa/.cursor/hooks/` | ✅ PASS |

### P2: Subagente

| Criterion | Spec-defined outcome | `file:line` + assertion / content | Result |
| --------- | -------------------- | --------------------------------- | ------ |
| HS-40 WHEN harness-score THEN AGT-01, AGT-02 pass | Scanner greens | reviewer.md artifact; T23 L2+ record | ✅ PASS |
| HS-41 `reviewer.md` YAML `name` + `description` ≥40 saying when to delegate review | Frontmatter | `.cursor/agents/reviewer.md:2-3` | ✅ PASS |
| HS-42 description says delegate test and lint review, not feature implementation | Exact intent | `.cursor/agents/reviewer.md:3` | ✅ PASS |

**Status**: ⚠️ Spec-precision gaps flagged (1 SPEC_DEVIATION on T13/`files: []` → `include: []`); remaining ACs evidence-matched

---

## Discrimination Sensor

Scratch: `git worktree add --detach <temp> HEAD`. Real-repo porcelain unchanged after remove.

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| A | scratch `.cursor/hooks/gate-shell.mjs:67` | Force-push/reset branch `return "deny"` → `return "allow"` | ✅ Killed — `node --test .cursor/hooks/gate-shell.test.mjs` exit 1; fails `.cursor/hooks/gate-shell.test.mjs:24` and `:28` |
| B | scratch `.cursor/hooks/format-on-edit.mjs:19` | Inverted `if (!isUnderFront(...))` → `if (isUnderFront(...))` so front paths skip Prettier | ✅ Killed — `node --test .cursor/hooks/format-on-edit.test.mjs` exit 1; fails `.cursor/hooks/format-on-edit.test.mjs:40` and `:48` |

**Sensor depth**: lightweight (highest-risk new behavior: hooks)
**Result**: 2/2 killed - PASS
**Isolation**: porcelain before == porcelain after

---

## Interactive UAT Results

N/A — harness/infrastructure feature; automated checks only.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ |
| No scope creep | ✅ (no JSX migration; empty mcpServers; dual hooks.json as assumed) |
| Matches patterns | ✅ |
| Spec-anchored outcome check | ⚠️ one SPEC_DEVIATION noted for empty-tsconfig shape |
| Per-layer Coverage Expectation met | ✅ hooks have deny/allow + front/back format tests; config ACs via file content |
| Every test maps to a spec requirement | ✅ gate-shell 8 cases → HS-36/37; format-on-edit 2 → HS-38 |
| Documented guidelines followed: none - strong defaults applied (per tasks.md matrix) | ✅ |

---

## Edge Cases

- [x] Empty lockfile / HYG-07: `agenda/package-lock.json` exists (`Test-Path` True) — avoids HYG-07 fail path
- [x] Second always-on without globs: only one `alwaysApply: true` rule; two glob rules present — CTX-05 fail path avoided
- [x] `.env.example` negation: `!.env.example` in `../.gitignore:3` and `.gitignore:28`; `git check-ignore -v back/.env.example` exit 1 (not ignored)
- [x] Hook path depth: `../.cursor/hooks.json:6` uses `node zenspa/.cursor/hooks/gate-shell.mjs` (not `.cursor/hooks/...` alone)
- [x] LICENSE only in zenspa would fail HYG-05: both `../LICENSE` and `LICENSE` present
- [x] `back/.env` already ignored by `back/.gitignore`: still ignored; root patterns also present (`.gitignore:26-28`); file not deleted (`Test-Path` True)

---

## Gate Check

- **Gate command**: `node --test .cursor/hooks/gate-shell.test.mjs .cursor/hooks/format-on-edit.test.mjs`; `npm run lint` in `front/`; `docker exec -w /var/www zenspa-api composer test` (Docker was already up)
- **Hook tests**: 10 passed, 0 failed, 0 skipped
- **Front lint**: exit 0 (2 warnings in `AdminDashboard.jsx`, 0 errors)
- **Composer test**: 47 passed (107 assertions), 0 failed
- **Typecheck (supporting HS-25)**: `npm run typecheck` in `front/` exit 0
- **harness-score**: not re-run; no persisted report file from `bd59171`; T23 Done-when claims L2+; orchestrator states that run recorded L4
- **Test count before feature (hooks)**: 0
- **Test count after feature (hooks)**: 10
- **Delta**: +10 hook tests
- **PHPUnit delta**: 0 new/deleted PHP tests in this feature surface
- **Skipped tests**: none
- **Failures**: none

---

## Fix Plans

### Note 1: SPEC_DEVIATION — tsconfig empty roots

- **Root cause**: TypeScript 5.9 rejects `"files": []` with TS18002 (exit 2). Implementer switched to `"include": []` + `"references": []` while keeping `strict`/`allowJs`/`noEmit`.
- **Fix task**: Update future task/spec wording to require `include: []` (not `files: []`) when the goal is “strict tsconfig without typechecking JSX”. Optional: add a one-line note under SNS-03 assumptions in a later clarify pass (do not treat as product-code fix).
- **Priority**: Minor (documented SPEC_DEVIATION; typecheck exit 0 still holds)

### Note 2: Traceability table still `Implementing`

- **Root cause**: T23 checked “42 requisitos como cobertos” but only flipped a few Pending→Implementing; coverage footer still `0 mapped`.
- **Fix task**: Mark HS-01..HS-42 Verified / mapped in `spec.md` in a docs-only follow-up (Verifier was instructed not to edit `spec.md` this pass).
- **Priority**: Cosmetic / process

---

## Requirement Traceability Update

(Recommended statuses — **not written** to `spec.md` per verifier hard rule.)

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| HS-01..HS-23, HS-25..HS-42 | Implementing | ✅ Verified (evidence in tables above) |
| HS-24 (`strict: true`) | Implementing | ✅ Verified |
| HS-24 empty-files bullet (task-level) | Implementing | ⚠️ SPEC_DEVIATION (`include: []` / `references: []`) |

---

## Summary

**Overall**: ✅ Ready (with documented SPEC_DEVIATION)

**Spec-anchored check**: 41/42 precise AC outcomes matched; 1 spec-precision / SPEC_DEVIATION (`files: []` → `include: []`)
**Sensor**: 2/2 mutations killed
**Gate**: hooks 10 passed; front lint exit 0; composer 47 passed

**What works**: Dual-root harness config, gitignore/.env protection, rules/skills/commands/agent, CI+husky, shell deny/allow hooks, front format-on-edit, typecheck/prettier sensors, discrimination sensor kills.

**Issues found**: T13 SPEC_DEVIATION on empty tsconfig shape; T23 overclaimed traceability Verified mapping.

**Next steps**: Optional docs clarify for `include: []`; optional traceability status bump in `spec.md` by implementer.

---

## Validation: harness-l2 - PASS
