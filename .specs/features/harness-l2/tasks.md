# Harness L2 Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: skipped. The spec was approved and design.md was not created.
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. Sampled `back/phpunit.xml` (no coverage threshold), `back/tests/Feature/*Test.php`, `back/tests/Unit/ExampleTest.php` (PHPUnit), and `front/package.json` (`lint` = `eslint .`). No `AGENTS.md`, `CONTRIBUTING.md`, or coverage gate. This feature adds no PHP domain code. The only behavioral layer is the Cursor hook scripts, so those use Node's built-in test runner. Config and docs stay on the entity/config default.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Hook gate (`beforeShellExecution`) | unit | All branches; 1:1 with HS-36 and HS-37; recursive delete of a build directory is allowed; recursive delete of any other path is denied | `zenspa/.cursor/hooks/*.test.mjs` | `node --test .cursor/hooks` (cwd `zenspa`) |
| Hook feedback (`afterFileEdit`) | unit | HS-38: Prettier is invoked for a path under `front/`; it is not invoked for a path outside `front/` | `zenspa/.cursor/hooks/*.test.mjs` | `node --test .cursor/hooks` (cwd `zenspa`) |
| Harness config, rules, commands, agent, CI, gitignore, license, MCP | none | Build gate only. File content matches the task acceptance criteria | - | Build gate for that task |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After the hook-script tasks | `node --test .cursor/hooks` from `zenspa` |
| Full | After the root test-script task, and as regression on the closing scan | `composer test --working-dir=zenspa/back` and `npm run lint` from `zenspa/front` |
| Build | Config, docs, and CI tasks; closing scan | The file checks in that task's **Done when**. The closing task also runs `npx harness-score` in `agenda` |

---

## Execution Plan

Phases run in order. Tasks inside a phase run in order. A batch is one or more consecutive whole phases, packed near 7 tasks. This feature is 23 tasks, so Execute offers four sequential batches before any worker starts:

1. Phase 1 (5)
2. Phase 2 + Phase 3 (6)
3. Phase 4 (5)
4. Phase 5 + Phase 6 + Phase 7 (7)

### Phase 1: Higiene da raiz medida e do git

Arquivos independentes. O scan de higiene só fica verde quando a fase inteira existe.

```
T1
T2
T3
T4
T5
```

### Phase 2: Contexto

A regra com `globs` precisa existir depois da regra always-on, senão um scan intermediário reprova CTX-05.

```
T6 → T7 → T8
```

T9 não depende das regras.

### Phase 3: Skills, comando e subagente

```
T10
T11
```

### Phase 4: Sensores

`agenda/package.json` e o lockfile nascem no mesmo commit (senão HYG-07, hoje verde, cai). O script `format` edita `front/package.json` depois do script `typecheck`.

```
T13 → T14 → T16
T15 → T16
```

T12 não depende do front.

### Phase 5: CI e pre-commit

```
T17
T18
```

### Phase 6: Hooks

Os JSON só entram depois que os scripts existem no disco.

```
T19 → T21
T20 → T21
T19 → T22
T20 → T22
```

T20 também depende de T16 (Prettier instalado). Essa aresta cruza de fase e não aparece no diagrama desta fase.

### Phase 7: Scan

T23 depende de T1–T22. São dependências para fases anteriores, então o diagrama desta fase não desenha seta.

```
T23
```

---

## Task Breakdown

### Phase 1: Higiene da raiz medida e do git

### T1: Ignorar env na raiz medida

**What**: Criar `agenda/.gitignore` com as três linhas de env.
**Where**: `agenda/.gitignore`
**Depends on**: None
**Reuses**: o padrão `.env` já presente em `zenspa/back/.gitignore`
**Requirement**: HS-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O arquivo contém uma linha `.env`, uma linha `.env.*` e uma linha `!.env.example`
- [x] Nenhuma outra regra apaga `.env.example` sem a negação
- [x] Gate build: as três linhas estão presentes

**Tests**: none
**Gate**: build

**Commit**: `chore(hygiene): ignore env files at the scan root`

---

### T2: Ignorar env dentro do git de zenspa

**What**: Acrescentar o mesmo trio de env ao `.gitignore` que o git de `zenspa` lê, sem apagar os arquivos locais.
**Where**: `zenspa/.gitignore`
**Depends on**: None
**Reuses**: `zenspa/.gitignore` e `zenspa/back/.gitignore`
**Requirement**: HS-14, HS-15, HS-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O arquivo contém `.env`, `.env.*` e `!.env.example`, e o restante do arquivo permanece
- [x] `git -C zenspa check-ignore` sai 0 para `.env.docker`, `front/.env` e `back/.env`
- [x] `git check-ignore -v` em `.env.docker` e `front/.env` cita `zenspa/.gitignore`
- [x] Os três arquivos ainda existem no disco
- [x] `back/.env.example` continua não ignorado
- [x] Gate build: os três `check-ignore` passam e os arquivos existem

**Tests**: none
**Gate**: build

**Commit**: `chore(hygiene): ignore env files in the zenspa repo`

---

### T3: Licença MIT na raiz medida

**What**: Criar a licença MIT que o scan de `agenda` lê.
**Where**: `agenda/LICENSE`
**Depends on**: None
**Reuses**: `"license": "MIT"` em `zenspa/back/composer.json`
**Requirement**: HS-17

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O arquivo é o texto padrão da licença MIT
- [x] A linha de copyright é `Copyright (c) 2026 ZenSpa`
- [x] Gate build: o arquivo existe e contém `MIT License`

**Tests**: none
**Gate**: build

**Commit**: `docs(license): add mit license at the scan root`

---

### T4: Licença MIT no repositório

**What**: Criar a mesma licença MIT dentro de `zenspa`.
**Where**: `zenspa/LICENSE`
**Depends on**: None
**Reuses**: o texto escrito em T3
**Requirement**: HS-17

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O texto é idêntico ao de `agenda/LICENSE`
- [x] Gate build: o arquivo existe e contém `MIT License`

**Tests**: none
**Gate**: build

**Commit**: `docs(license): add mit license in zenspa`

---

### T5: MCP sem segredo

**What**: Criar a config MCP do projeto com a lista de servidores vazia.
**Where**: `zenspa/.cursor/mcp.json`
**Depends on**: None
**Reuses**: nenhum servidor MCP de projeto existe hoje
**Requirement**: HS-18, HS-19

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O arquivo é JSON válido e o valor de `mcpServers` é um objeto vazio
- [x] Não há token, chave ou senha literal
- [x] Gate build: `JSON.parse` aceita o arquivo e `mcpServers` é um objeto

**Tests**: none
**Gate**: build

**Commit**: `chore(mcp): add empty mcp server config`

---

### Phase 2: Contexto

### T6: Regra always-on

**What**: Criar a regra que o Cursor aplica em todo arquivo.
**Where**: `zenspa/.cursor/rules/always.mdc`
**Depends on**: None
**Reuses**: `AdminMiddleware` (`user.is_admin`) e a regra de não enfraquecer teste do protocolo de execução
**Requirement**: HS-04, HS-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O frontmatter tem `description` e `alwaysApply: true`, e não define `globs`
- [x] O corpo diz que arquivos `.env` não entram no stage, que testes não são enfraquecidos nem apagados para ficar verde, e que rotas admin exigem `is_admin`
- [x] O arquivo tem 500 linhas ou menos
- [x] Gate build: o frontmatter e as três frases estão no arquivo

**Tests**: none
**Gate**: build

**Commit**: `docs(rules): add always-on project rule`

---

### T7: Regra com glob de PHP

**What**: Criar a regra escopada em `back/**/*.php`, para CTX-05 deixar de ser "tudo always-on".
**Where**: `zenspa/.cursor/rules/back-php.mdc`
**Depends on**: T6
**Reuses**: `zenspa/.cursor/rules/always.mdc`
**Requirement**: HS-02, HS-03, HS-05, HS-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Existem pelo menos dois `.mdc` em `zenspa/.cursor/rules/`, cada um com `description` e ou `globs` ou `alwaysApply`
- [x] Este arquivo define `globs: back/**/*.php` e não define `alwaysApply: true`
- [x] O arquivo tem 500 linhas ou menos
- [x] Gate build: o frontmatter tem esse glob e não tem `alwaysApply: true`

**Tests**: none
**Gate**: build

**Commit**: `docs(rules): add scoped php rule`

---

### T8: Regra com glob de frontend

**What**: Criar a regra escopada em `front/**/*.{js,jsx}`.
**Where**: `zenspa/.cursor/rules/front-jsx.mdc`
**Depends on**: T7
**Reuses**: `zenspa/.cursor/rules/back-php.mdc`
**Requirement**: HS-05, HS-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O frontmatter tem `description` e `globs: front/**/*.{js,jsx}`
- [x] O arquivo não define `alwaysApply: true`
- [x] O arquivo tem 500 linhas ou menos
- [x] Gate build: o glob está no frontmatter

**Tests**: none
**Gate**: build

**Commit**: `docs(rules): add scoped frontend rule`

---

### T9: README da raiz medida

**What**: Criar o README que CTX-07 lê em `agenda`.
**Where**: `agenda/README.md`
**Depends on**: None
**Reuses**: `zenspa/README.md` e os scripts `composer test` / `npm run lint`
**Requirement**: HS-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O arquivo nomeia `zenspa/back` e `zenspa/front`
- [x] O arquivo contém os comandos `composer test` e `npm run lint`
- [x] Gate build: as quatro strings estão no arquivo

**Tests**: none
**Gate**: build

**Commit**: `docs(readme): add scan-root readme`

---

### Phase 3: Skills, comando e subagente

### T10: Comando de verificação

**What**: Criar um comando de projeto que manda rodar o teste do back e o lint do front, e conferir que as skills já presentes continuam válidas.
**Where**: `zenspa/.cursor/commands/verify.md`
**Depends on**: None
**Reuses**: `zenspa/.cursor/skills/coding-guidelines/SKILL.md` e `zenspa/.cursor/skills/tlc-spec-driven/SKILL.md`
**Requirement**: HS-09, HS-10, HS-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O corpo manda rodar `composer test` em `zenspa/back` e `npm run lint` em `zenspa/front`
- [x] Os dois `SKILL.md` citados continuam com frontmatter `name` e `description`, e cada `description` tem 40 caracteres ou mais
- [x] Nenhum dos dois `SKILL.md` é reescrito
- [x] Gate build: o comando contém as duas strings e as duas descriptions passam de 40 caracteres

**Tests**: none
**Gate**: build

**Commit**: `docs(commands): add verify command`

---

### T11: Subagente de revisão

**What**: Criar o subagente que o pai delega para revisar teste e lint.
**Where**: `zenspa/.cursor/agents/reviewer.md`
**Depends on**: None
**Reuses**: o frontmatter de `zenspa/.cursor/skills/coding-guidelines/SKILL.md`
**Requirement**: HS-41, HS-42

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O frontmatter tem `name` e `description`
- [ ] `description` tem 40 caracteres ou mais, diz quando delegar uma revisão, e diz que a delegação é de teste e lint, não de implementação de feature
- [ ] Gate build: `name` e `description` existem e o texto cobre teste, lint e o limite de não implementar feature

**Tests**: none
**Gate**: build

**Commit**: `docs(agents): add review subagent`

---

### Phase 4: Sensores

### T12: Script de teste na raiz medida

**What**: Criar o `package.json` da raiz do scan com `scripts.test`, e o lockfile no mesmo commit.
**Where**: `agenda/package.json`
**Depends on**: None
**Reuses**: `composer test` em `zenspa/back/composer.json`
**Requirement**: HS-21, HS-22, HS-23

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `scripts.test` é exatamente `composer test --working-dir=zenspa/back`
- [ ] `agenda/package-lock.json` existe no mesmo commit
- [ ] `composer test --working-dir=zenspa/back` sai 0, e nenhum teste PHPUnit é apagado ou enfraquecido
- [ ] Gate full: esse `composer test` sai 0

**Tests**: none
**Gate**: full

**Commit**: `build(sensors): add root test script and lockfile`

---

### T13: tsconfig strict do front

**What**: Criar o tsconfig que o scanner reconhece, sem passar a checar JSX.
**Where**: `zenspa/front/tsconfig.json`
**Depends on**: None
**Reuses**: `zenspa/front/package.json` (o projeto já é ESM com JSX via Vite)
**Requirement**: HS-24

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `compilerOptions.strict` é `true`, `allowJs` é `false` e `noEmit` é `true`
- [ ] `files` é um array vazio, para `tsc` não incluir o JSX atual
- [ ] Gate build: o JSON contém `"strict": true`

**Tests**: none
**Gate**: build

**Commit**: `build(sensors): add strict frontend tsconfig`

---

### T14: Script typecheck

**What**: Instalar TypeScript no front e adicionar `npm run typecheck`.
**Where**: `zenspa/front/package.json`
**Depends on**: T13
**Reuses**: `zenspa/front/tsconfig.json` e `zenspa/front/package-lock.json`
**Requirement**: HS-25

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `scripts.typecheck` é `tsc --noEmit`
- [ ] `typescript` está em `devDependencies` e `zenspa/front/package-lock.json` foi atualizado no mesmo commit
- [ ] `npm run typecheck` em `zenspa/front` sai 0
- [ ] A árvore JSX não é reformatada nem migrada
- [ ] Gate build: `npm run typecheck` sai 0

**Tests**: none
**Gate**: build

**Commit**: `build(sensors): add frontend typecheck script`

---

### T15: Config do Prettier

**What**: Criar a config do Prettier que SNS-04 procura.
**Where**: `zenspa/front/.prettierrc.json`
**Depends on**: None
**Reuses**: nenhum formatter de front existe hoje
**Requirement**: HS-26

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O arquivo é JSON válido (objeto vazio é suficiente)
- [ ] O comando de formatar a árvore inteira não é executado
- [ ] Gate build: o arquivo existe e `JSON.parse` aceita

**Tests**: none
**Gate**: build

**Commit**: `build(sensors): add prettier config`

---

### T16: Script format

**What**: Instalar Prettier no front e adicionar o script `format`.
**Where**: `zenspa/front/package.json`
**Depends on**: T14, T15
**Reuses**: `zenspa/front/.prettierrc.json` e o `package-lock.json` deixado por T14
**Requirement**: HS-26

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `scripts.format` invoca Prettier
- [ ] `prettier` está em `devDependencies` e o lockfile do front foi atualizado no mesmo commit
- [ ] `scripts.typecheck` criado em T14 continua presente
- [ ] `prettier --write` não é executado na árvore inteira
- [ ] Gate build: `npm run format -- --version` em `zenspa/front` sai 0

**Tests**: none
**Gate**: build

**Commit**: `build(sensors): add frontend format script`

---

### Phase 5: CI e pre-commit

### T17: Workflow de CI

**What**: Criar o workflow que roda o teste do back e o lint do front.
**Where**: `zenspa/.github/workflows/ci.yml`
**Depends on**: None
**Reuses**: `zenspa/back/phpunit.xml` (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`) e `npm run lint` em `zenspa/front/package.json`
**Requirement**: HS-28, HS-29, HS-30

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O YAML contém as strings `phpunit` e `eslint`
- [ ] O passo de teste roda `composer test` ou `php artisan test` em `zenspa/back` e não redefine o sqlite em memória que já está no `phpunit.xml`
- [ ] O passo de lint roda `npm run lint` em `zenspa/front`
- [ ] O job usa `ubuntu-latest`, PHP 8.2 e Node 22
- [ ] Gate build: as quatro strings `phpunit`, `eslint`, `composer test` (ou `php artisan test`) e `npm run lint` estão no arquivo

**Tests**: none
**Gate**: build

**Commit**: `ci(workflow): run phpunit and eslint`

---

### T18: Hook de pre-commit

**What**: Criar o pre-commit que roda o lint do front, e apontar o git de `zenspa` para `.husky`.
**Where**: `zenspa/.husky/pre-commit`
**Depends on**: None
**Reuses**: `npm run lint` em `zenspa/front/package.json`
**Requirement**: HS-31, HS-32

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O arquivo invoca `npm run lint` em `zenspa/front`
- [ ] `git -C zenspa config core.hooksPath` é `.husky`
- [ ] Um commit de probe em `zenspa` executa esse arquivo antes do objeto de commit existir (o probe não entra no histórico: criar e, se o lint passar, deixar o commit da própria task; se o lint falhar, o gate desta task falha)
- [ ] Gate build: o arquivo contém `npm run lint` e `core.hooksPath` é `.husky`

**Tests**: none
**Gate**: build

**Commit**: `ci(husky): lint frontend before commit`

---

### Phase 6: Hooks

### T19: Gate de shell

**What**: Criar o script que nega comando destrutivo e permite teste e lint, com os testes no mesmo commit.
**Where**: `zenspa/.cursor/hooks/gate-shell.mjs`
**Depends on**: None
**Reuses**: o contrato `beforeShellExecution` do Cursor (stdin JSON com `command`; stdout JSON com `permission`)
**Requirement**: HS-36, HS-37

**Tools**:

- MCP: NONE
- Skill: `coding-guidelines`

**Done when**:

- [ ] O script lê `command` do JSON no stdin, escreve `{"permission":"deny"}` ou `{"permission":"allow"}` e sai 0
- [ ] Nega quando o comando contém `git push --force` ou `git reset --hard`
- [ ] Nega remoção recursiva (`rm -rf`, `rm -fr`, ou `Remove-Item` com `-Recurse`) quando algum alvo não é um diretório de build
- [ ] Diretório de build é um segmento final `dist`, `build` ou `node_modules`
- [ ] Permite `composer test`, `npm run lint`, remoção recursiva só de diretório de build, e qualquer outro comando
- [ ] `git push --force-with-lease` cai na negação porque contém `git push --force`
- [ ] `zenspa/.cursor/hooks/gate-shell.test.mjs` cobre estes 8 casos: deny `git push --force`, deny `git reset --hard`, deny `rm -rf src`, deny `Remove-Item -Recurse src`, allow `composer test`, allow `npm run lint`, allow `rm -rf dist`, allow `git status`
- [ ] Gate quick: `node --test .cursor/hooks/gate-shell.test.mjs` de `zenspa` mostra 8 testes passando

**Tests**: unit
**Gate**: quick

**Commit**: `feat(hooks): deny destructive shell commands`

---

### T20: Feedback de formatação

**What**: Criar o script que roda Prettier no arquivo editado quando ele está em `front/`, com os testes no mesmo commit.
**Where**: `zenspa/.cursor/hooks/format-on-edit.mjs`
**Depends on**: T16
**Reuses**: `zenspa/front/.prettierrc.json` e o binário Prettier instalado em T16
**Requirement**: HS-38

**Tools**:

- MCP: NONE
- Skill: `coding-guidelines`

**Done when**:

- [ ] O script lê `file_path` do JSON no stdin
- [ ] Se o caminho está sob `front/`, o script invoca Prettier nesse arquivo (`PRETTIER_BIN` substitui o executável nos testes; o default é `npx`)
- [ ] Se o caminho não está sob `front/`, o script sai 0 e não invoca Prettier
- [ ] `zenspa/.cursor/hooks/format-on-edit.test.mjs` cobre 2 casos: um path sob `front/` registra o arquivo no recorder; um path sob `back/` não registra
- [ ] Gate quick: `node --test .cursor/hooks` de `zenspa` mostra 10 testes passando (8 do gate + 2 deste script)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(hooks): format frontend files after edit`

---

### T21: hooks.json da raiz medida

**What**: Registrar os dois eventos no `hooks.json` que o scanner escolhe em `agenda`.
**Where**: `agenda/.cursor/hooks.json`
**Depends on**: T19, T20
**Reuses**: `zenspa/.cursor/hooks/gate-shell.mjs` e `zenspa/.cursor/hooks/format-on-edit.mjs`
**Requirement**: HS-34, HS-39

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O JSON tem `version` numérico
- [ ] `beforeShellExecution` e `afterFileEdit` têm `command` não vazio
- [ ] O command do gate é `node zenspa/.cursor/hooks/gate-shell.mjs` com `failClosed: true`
- [ ] O command do feedback é `node zenspa/.cursor/hooks/format-on-edit.mjs`
- [ ] Os dois caminhos relativos existem a partir de `agenda`
- [ ] O command não é só `.cursor/hooks/...` (isso reprova HKS-05 na raiz do scan)
- [ ] Gate build: o JSON parseia, `version` é número, e os dois arquivos de script existem

**Tests**: none
**Gate**: build

**Commit**: `feat(hooks): register hooks for the scan root`

---

### T22: hooks.json do workspace

**What**: Registrar os mesmos dois eventos com caminhos relativos a `zenspa`.
**Where**: `zenspa/.cursor/hooks.json`
**Depends on**: T19, T20
**Reuses**: os scripts de T19 e T20
**Requirement**: HS-35, HS-39

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O JSON tem `version` numérico e os mesmos dois eventos
- [ ] O command do gate é `node .cursor/hooks/gate-shell.mjs` com `failClosed: true`
- [ ] O command do feedback é `node .cursor/hooks/format-on-edit.mjs`
- [ ] Os dois caminhos existem a partir de `zenspa`
- [ ] Gate build: o JSON parseia e os dois scripts existem

**Tests**: none
**Gate**: build

**Commit**: `feat(hooks): register hooks for the zenspa workspace`

---

### Phase 7: Scan

### T23: Confirmar L2 no scan de agenda

**What**: Rodar o scanner na pasta medida e marcar os requisitos cujo critério é o próprio scan.
**Where**: `.specs/features/harness-l2/spec.md`
**Depends on**: T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21, T22
**Reuses**: os artefatos das tasks anteriores
**Requirement**: HS-01, HS-08, HS-12, HS-20, HS-27, HS-33, HS-40

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `npx harness-score` em `agenda` reporta nível L2 ou superior
- [ ] Passam: CTX-03, CTX-04, CTX-05, CTX-06, CTX-07, SKL-01, SKL-02, SKL-03, SKL-04, AGT-01, AGT-02, HKS-01, HKS-02, HKS-03, HKS-04, HKS-05, SNS-01, SNS-03, SNS-04, CI-01, CI-02, CI-03, CI-04, HYG-01, HYG-02, HYG-03, HYG-05, HYG-08
- [ ] Continuam passando: CTX-01, CTX-02, CTX-08, SNS-02, SNS-05, HYG-04, HYG-06, HYG-07
- [ ] A tabela de rastreabilidade da spec marca os 42 requisitos como cobertos por estas tasks
- [ ] Gate full de regressão: `composer test --working-dir=zenspa/back` sai 0 e `npm run lint` em `zenspa/front` sai 0
- [ ] Gate build: o relatório do `npx harness-score` mostra L2 ou superior

**Tests**: none
**Gate**: build

**Commit**: `test(harness): confirm the agenda scan reaches l2`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

Phase 2:  T6 → T7 → T8
Phase 4:  T13 → T14 → T16
Phase 4:  T15 → T16
Phase 6:  T19 → T21
Phase 6:  T20 → T21
Phase 6:  T19 → T22
Phase 6:  T20 → T22
```

Fases 1, 3, 5 e 7 não têm dependência interna. T9, T12 e T20→T16 ficam de fora deste mapa: T9 e T12 não dependem de ninguém na fase, e T20 depende de T16 numa fase anterior.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: `agenda/.gitignore` | 1 arquivo | ✅ Granular |
| T2: `zenspa/.gitignore` | 1 arquivo | ✅ Granular |
| T3: `agenda/LICENSE` | 1 arquivo | ✅ Granular |
| T4: `zenspa/LICENSE` | 1 arquivo | ✅ Granular |
| T5: `mcp.json` | 1 arquivo | ✅ Granular |
| T6: `always.mdc` | 1 arquivo | ✅ Granular |
| T7: `back-php.mdc` | 1 arquivo | ✅ Granular |
| T8: `front-jsx.mdc` | 1 arquivo | ✅ Granular |
| T9: `agenda/README.md` | 1 arquivo | ✅ Granular |
| T10: `verify.md` | 1 arquivo | ✅ Granular |
| T11: `reviewer.md` | 1 arquivo | ✅ Granular |
| T12: `agenda/package.json` | 1 manifesto; o lockfile é o artefato gerado no mesmo commit (aresta HYG-07) | ✅ Granular |
| T13: `tsconfig.json` | 1 arquivo | ✅ Granular |
| T14: `front/package.json` (typecheck) | 1 arquivo; lockfile atualizado no mesmo commit | ✅ Granular |
| T15: `.prettierrc.json` | 1 arquivo | ✅ Granular |
| T16: `front/package.json` (format) | 1 arquivo; lockfile atualizado no mesmo commit | ✅ Granular |
| T17: `ci.yml` | 1 arquivo | ✅ Granular |
| T18: `.husky/pre-commit` | 1 arquivo | ✅ Granular |
| T19: `gate-shell.mjs` + teste co-locado | 1 script; o teste não é task separada | ✅ Granular |
| T20: `format-on-edit.mjs` + teste co-locado | 1 script; o teste não é task separada | ✅ Granular |
| T21: `agenda/.cursor/hooks.json` | 1 arquivo | ✅ Granular |
| T22: `zenspa/.cursor/hooks.json` | 1 arquivo | ✅ Granular |
| T23: rastreabilidade na spec | 1 arquivo | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | sem seta | ✅ Match |
| T2 | None | sem seta | ✅ Match |
| T3 | None | sem seta | ✅ Match |
| T4 | None | sem seta | ✅ Match |
| T5 | None | sem seta | ✅ Match |
| T6 | None | origem de T6 → T7 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | None | sem seta | ✅ Match |
| T10 | None | sem seta | ✅ Match |
| T11 | None | sem seta | ✅ Match |
| T12 | None | sem seta | ✅ Match |
| T13 | None | origem de T13 → T14 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | None | origem de T15 → T16 | ✅ Match |
| T16 | T14, T15 | T14 → T16 e T15 → T16 | ✅ Match |
| T17 | None | sem seta | ✅ Match |
| T18 | None | sem seta | ✅ Match |
| T19 | None | origem de T19 → T21 e T19 → T22 | ✅ Match |
| T20 | T16 | T20 → T21 e T20 → T22; T16 é fase anterior, sem seta intra-fase | ✅ Match |
| T21 | T19, T20 | T19 → T21 e T20 → T21 | ✅ Match |
| T22 | T19, T20 | T19 → T22 e T20 → T22 | ✅ Match |
| T23 | T1–T22 | sem seta intra-fase; todas as deps são de fases anteriores | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Harness config | none | none | ✅ OK |
| T2 | Harness config | none | none | ✅ OK |
| T3 | Harness config | none | none | ✅ OK |
| T4 | Harness config | none | none | ✅ OK |
| T5 | Harness config | none | none | ✅ OK |
| T6 | Harness config | none | none | ✅ OK |
| T7 | Harness config | none | none | ✅ OK |
| T8 | Harness config | none | none | ✅ OK |
| T9 | Harness config | none | none | ✅ OK |
| T10 | Harness config | none | none | ✅ OK |
| T11 | Harness config | none | none | ✅ OK |
| T12 | Harness config | none | none | ✅ OK |
| T13 | Harness config | none | none | ✅ OK |
| T14 | Harness config | none | none | ✅ OK |
| T15 | Harness config | none | none | ✅ OK |
| T16 | Harness config | none | none | ✅ OK |
| T17 | Harness config | none | none | ✅ OK |
| T18 | Harness config | none | none | ✅ OK |
| T19 | Hook gate | unit | unit | ✅ OK |
| T20 | Hook feedback | unit | unit | ✅ OK |
| T21 | Harness config | none | none | ✅ OK |
| T22 | Harness config | none | none | ✅ OK |
| T23 | Harness config | none | none | ✅ OK |
