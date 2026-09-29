# Harness Score L2 Specification

## Problem Statement

O `harness-score` foi executado na pasta `agenda` (pai de `zenspa`), não dentro do repositório git. Os caminhos do relatório (`zenspa/.env.docker`, `zenspa/back/.env`, `zenspa/front/.env`) e a ausência de `README.md` / `.gitignore` na raiz medida comprovam isso: esses arquivos já existem dentro de `zenspa/`, mas vários checks leem só a raiz do scan.

A nota está em L1 (contexto 8/20 = 40%). Os 28 checks reprovados somam 84 pontos. Fechá-los, sem regredir os checks que já passam, leva o scan da mesma pasta a 108/108. O próprio relatório pede, no mínimo, L2: contexto ≥ 60%, skills ≥ 30% ou hooks ≥ 30%, higiene ≥ 50%.

## Goals

- [ ] Um novo `npx harness-score` na pasta `agenda` reporta nível L2 ou superior.
- [ ] Os 28 checks listados no relatório passam.
- [ ] CTX-01, CTX-02, CTX-08, SNS-02, SNS-05, HYG-04, HYG-06 e HYG-07 continuam passando.
- [ ] Segredos de `.env` deixam de ser adicionáveis por `git add` dentro de `zenspa`, e os arquivos locais não são apagados.

## Out of Scope

| Item | Motivo |
| ---- | ------ |
| Transformar `agenda` num repositório git ou mover a raiz git de `zenspa` | O git que existe é `zenspa/`. Inicializar outro repositório por cima não faz parte da nota. |
| Migrar o frontend JSX para TypeScript, ou ligar `checkJs` | SNS-03 aceita `tsconfig.json` com `strict: true`. Checar todo o JSX é outro projeto. |
| Adotar PHPStan ou tratar Pint como sensor do scanner | SNS-03 não reconhece PHPStan. SNS-01 não reconhece PHPUnit. SNS-04 não reconhece Pint. O CI pode chamar PHPUnit; a nota de sensor não. |
| Reformatar a árvore inteira com Prettier | A nota exige o config, não um diff de formatação. |
| Publicar badge, GitHub Pages, ou `--scope user` | O relatório pede maturidade do diretório escaneado. |
| Desligar checks via `.harness-score.json` | A nota sobe porque o harness existe, não porque o check foi excluído. |
| Mover skills de `.junie/skills/` | Esse diretório não entra em SKL-01. |
| Apagar `.env`, `.env.docker` ou `front/.env` | São estado local. A proteção é o gitignore. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Diretório medido | `C:\Users\Pablo Roberto\Documents\projects\agenda` | O relatório prefixa caminhos com `zenspa/`. README e `.gitignore` de `zenspa/` não contam para checks de raiz. | n |
| Onde vive cada arquivo | Checks de raiz (`ctx.has` de `README.md`, `.gitignore`, `LICENSE`, `package.json`, `package-lock.json`) ficam em `agenda/`. Rules, skills, commands, agents, hooks, CI, Prettier, tsconfig e Husky ficam em `zenspa/`, que é o workspace do Cursor e o git. | O scanner encontra harness aninhado. O Cursor aberto em `zenspa` não carrega `.cursor` do pai. | n |
| Hooks e o HKS-05 | Dois `hooks.json`. O de `agenda/.cursor/hooks.json` (profundidade 0, o que o scanner escolhe) aponta para `zenspa/.cursor/hooks/`. O de `zenspa/.cursor/hooks.json` aponta para `.cursor/hooks/`, que é o cwd do Cursor. Os scripts existem uma vez, em `zenspa/.cursor/hooks/`. | `hookCommandPathsResolve` procura o caminho a partir da raiz do scan. O Cursor executa o comando a partir de `zenspa`. Um único caminho relativo não serve aos dois. | n |
| SNS-01 | `agenda/package.json` com `scripts.test` igual a `composer test --working-dir=zenspa/back`, mais `agenda/package-lock.json` | PHPUnit não entra em SNS-01. Um `package.json` na raiz sem lockfile faria HYG-07, hoje verde, falhar. | n |
| SNS-03 | `zenspa/front/tsconfig.json` com `"strict": true`, `allowJs: false`, `noEmit: true`, e `npm run typecheck` (`tsc --noEmit`) saindo 0 | Qualquer tsconfig já passa o check. `strict: true` é o que o relatório pede. Sem `checkJs`, o JSX atual não vira uma migração. | n |
| SNS-04 | `zenspa/front/.prettierrc.json` e script `format` no `front/package.json` | Pint não é detectado. O scanner acha `.prettierrc` em qualquer profundidade. | n |
| Licença | MIT, em `agenda/LICENSE` e `zenspa/LICENSE` | `zenspa/back/composer.json` já declara `"license": "MIT"`. | n |
| MCP | `zenspa/.cursor/mcp.json` com `{"mcpServers":{}}` | Não há servidor MCP de projeto. Arquivo vazio de servidores passa HYG-08 e não inventa credencial. Campo com formato de segredo, se aparecer depois, usa `${VAR}`. | n |
| Skills já presentes | `zenspa/.cursor/skills/coding-guidelines` e `tlc-spec-driven` permanecem, com o frontmatter atual | Os dois já têm `name` e `description` com mais de 40 caracteres. O relatório não os viu; o gate é um scan novo. Não duplicar skill só para a nota. | n |
| CI | GitHub Actions em `zenspa/.github/workflows/ci.yml`, Ubuntu, PHP 8.2, Node 22, SQLite em memória | `phpunit.xml` já usa `DB_CONNECTION=sqlite` e `DB_DATABASE=:memory:`. O scanner acha workflow em qualquer profundidade e procura as palavras `phpunit` e `eslint`. | n |

**Open questions:** none

### Dimensões implícitas

| Dimensão | Resolução |
| -------- | --------- |
| Validação de entrada | O `hooks.json` é JSON com `version` e handlers `command` não vazios. O `.gitignore` da raiz do scan contém uma linha que começa com `.env`. O `mcp.json` é JSON sem segredo literal. |
| Falha / falha parcial | IF o comando do hook cita um caminho e o arquivo não existe, HKS-05 falha. Os scripts referenciados existem no disco. |
| Idempotência | N/A: são arquivos de harness. Reescrever o mesmo conteúdo não muda comportamento. |
| Auth e limites | O hook `beforeShellExecution` nega `git push --force`, `git reset --hard` e remoção recursiva fora de um diretório de build. Nenhum token entra em rule, skill, hook ou MCP. |
| Concorrência | N/A: não há estado compartilhado em runtime. |
| Ciclo de vida dos dados | `.env`, `.env.docker` e `front/.env` permanecem no disco e fora do stage. `.env.example` continua versionável. |
| Observabilidade | O workflow de CI executa PHPUnit e ESLint. Não há métrica nova de aplicação. |
| Dependência externa | N/A para circuit breaker. O workflow declara as ações de checkout, PHP e Node. Não exigimos que o GitHub já tenha executado o pipeline. |
| Integridade de transição | N/A: não há máquina de estados de negócio. |

---

## User Stories

### P1: Contexto que o Cursor carrega por caminho ⭐ MVP

**User Story**: Como agente trabalhando no ZenSpa, quero regras curtas e com escopo de arquivo para aplicar só o que importa ao arquivo aberto.

**Why P1**: Contexto está em 40%. CTX-03 sozinho (+4) chega aos 60% do L2. CTX-04, CTX-05 e CTX-06 acompanham se as regras tiverem frontmatter, pelo menos uma for por glob, e nenhuma passar de 500 linhas. CTX-07 é o README na raiz medida.

**Acceptance Criteria**:

1. WHEN `npx harness-score` runs in `agenda` THEN the scanner SHALL pass CTX-03, CTX-04, CTX-05, CTX-06, and CTX-07.
2. The repository SHALL contain at least two `.mdc` files under `zenspa/.cursor/rules/`, each with YAML frontmatter `description` and either `globs` or `alwaysApply`.
3. WHILE more than one rule file exists, at least one rule SHALL set `globs` and SHALL NOT set `alwaysApply: true`.
4. The always-applied rule SHALL state that `.env` files are never staged, that tests are not weakened or deleted to go green, and that admin routes require `is_admin`.
5. One rule SHALL set `globs` to `back/**/*.php`. One rule SHALL set `globs` to `front/**/*.{js,jsx}`.
6. IF a rule file has more than 500 lines THEN that file SHALL be split before the scan is accepted.
7. WHEN the scan root is `agenda` THEN `agenda/README.md` SHALL exist and SHALL name `zenspa/back` and `zenspa/front` plus the commands `composer test` and `npm run lint`.

**Independent Test**: `npx harness-score` em `agenda` mostra CTX-03 a CTX-07 verdes. Abrir um PHP no Cursor carrega a regra de `back/`, não a de `front/`.

---

### P1: Skills e um comando explícito ⭐ MVP

**User Story**: Como agente, quero um comando que eu disparo de propósito, e skills cujo `description` diga quando entrar.

**Why P1**: Skills ≥ 30% é uma das duas portas do L2 (a outra é hooks). SKL-01 (4) + SKL-02 (3) = 7/17 = 41%. SKL-04 exige description ≥ 40 caracteres. SKL-03 é o comando que o relatório também cobra.

**Acceptance Criteria**:

1. WHEN `npx harness-score` runs in `agenda` THEN the scanner SHALL pass SKL-01, SKL-02, SKL-03, and SKL-04.
2. The skills `zenspa/.cursor/skills/coding-guidelines/SKILL.md` and `zenspa/.cursor/skills/tlc-spec-driven/SKILL.md` SHALL keep YAML frontmatter `name` and `description`.
3. IF a `SKILL.md` under `.cursor/skills/`, `.claude/skills/`, or `.agents/skills/` has a `description` shorter than 40 characters THEN the scan SHALL fail SKL-04 until that description states when to use the skill.
4. WHEN the user invokes a project command THEN `zenspa/.cursor/commands/` SHALL contain at least one `.md` file whose body tells the agent to run `composer test` in `zenspa/back` and `npm run lint` in `zenspa/front`.

**Independent Test**: O scan marca SKL-01 a SKL-04 verdes. O arquivo de comando existe e cita os dois comandos.

---

### P1: Higiene da raiz medida e do git ⭐ MVP

**User Story**: Como mantenedor, quero que a nota de higiene suba e que um `git add` em `zenspa` não consiga versionar `.env`.

**Why P1**: Higiene está em 9/23 = 39% (HYG-04, HYG-06 e HYG-07 já passam). HYG-01 + HYG-02 somam +5 e cruzam 50%. HYG-03 passa quando o `.gitignore` da raiz do scan tem padrão `.env`, mesmo com os arquivos no disco. HYG-05 e HYG-08 estão no relatório.

**Acceptance Criteria**:

1. WHEN `npx harness-score` runs in `agenda` THEN the scanner SHALL pass HYG-01, HYG-02, HYG-03, HYG-05, and HYG-08.
2. The file `agenda/.gitignore` SHALL contain a line matching `.env` or `.env.*`, and SHALL contain `!.env.example`.
3. The file `zenspa/.gitignore` SHALL contain the same `.env`, `.env.*`, and `!.env.example` lines.
4. IF `git -C zenspa check-ignore` is run on `zenspa/.env.docker`, `zenspa/front/.env`, and `zenspa/back/.env` THEN git SHALL report each path as ignored.
5. The files `zenspa/.env.docker`, `zenspa/front/.env`, and `zenspa/back/.env` SHALL still exist on disk after the gitignore change.
6. The files `agenda/LICENSE` and `zenspa/LICENSE` SHALL be the MIT license text.
7. The file `zenspa/.cursor/mcp.json` SHALL be valid JSON, SHALL contain an `mcpServers` object, and SHALL NOT contain a literal API token, key, or password.
8. IF a value in `zenspa/.cursor/mcp.json` sits under a key whose name is token, key, secret, password, or auth THEN that value SHALL match `${ENV_VAR}`.

**Independent Test**: O scan marca os cinco HYG verdes. `git check-ignore -v` nos três env aponta o `.gitignore` de `zenspa`. Os três arquivos continuam no disco.

---

### P2: Sensores que o scanner reconhece

**User Story**: Como agente, quero um comando de teste, um typecheck strict e um formatter que o scanner conte, em cima do PHPUnit e do ESLint que já existem.

**Why P2**: Não é a porta do L2. É a porta do L3 (sensores ≥ 60%). SNS-02 e SNS-05 já passam. SNS-01 vale 6 pontos e sozinho leva sensores de 7/20 para 13/20.

**Acceptance Criteria**:

1. WHEN `npx harness-score` runs in `agenda` THEN the scanner SHALL pass SNS-01, SNS-03, and SNS-04, and SHALL still pass SNS-02 and SNS-05.
2. The file `agenda/package.json` SHALL define `scripts.test` as `composer test --working-dir=zenspa/back`.
3. The file `agenda/package-lock.json` SHALL exist beside that `package.json`.
4. WHEN `composer test --working-dir=zenspa/back` runs THEN PHPUnit SHALL exit 0.
5. The file `zenspa/front/tsconfig.json` SHALL contain `"strict": true`.
6. WHEN `npm run typecheck` runs in `zenspa/front` THEN `tsc --noEmit` SHALL exit 0.
7. The file `zenspa/front/.prettierrc.json` SHALL exist, and `zenspa/front/package.json` SHALL define a `format` script that invokes Prettier.

**Independent Test**: O scan marca SNS-01, SNS-03 e SNS-04 verdes. `composer test` no back termina 0. `npm run typecheck` no front termina 0.

---

### P2: CI e pre-commit

**User Story**: Como revisor, quero o mesmo teste e o mesmo lint no GitHub Actions e antes do commit.

**Why P2**: CI ≥ 50% é a outra porta do L3. CI-01 + CI-02 = 8/14. CI-03 e CI-04 completam o relatório.

**Acceptance Criteria**:

1. WHEN `npx harness-score` runs in `agenda` THEN the scanner SHALL pass CI-01, CI-02, CI-03, and CI-04.
2. The file `zenspa/.github/workflows/ci.yml` SHALL contain the string `phpunit` and the string `eslint`.
3. WHEN that workflow's test step is read THEN it SHALL invoke `composer test` or `php artisan test` in `zenspa/back` with the sqlite memory settings already in `phpunit.xml`.
4. WHEN that workflow's lint step is read THEN it SHALL invoke `npm run lint` in `zenspa/front`.
5. The file `zenspa/.husky/pre-commit` SHALL exist and SHALL invoke `npm run lint` in `zenspa/front`.
6. WHEN a commit is created in the `zenspa` git repo after hook install THEN git SHALL run `zenspa/.husky/pre-commit` before the commit object exists.

**Independent Test**: O scan marca CI-01 a CI-04 verdes. O YAML contém `phpunit` e `eslint`. O arquivo `.husky/pre-commit` cita `npm run lint`.

---

### P2: Hooks de bloqueio e de feedback

**User Story**: Como agente, quero um gancho que recuse comando destrutivo e outro que rode depois de editar arquivo, com o script versionado.

**Why P2**: Hooks ≥ 30% é a alternativa à porta de skills. O relatório pede os cinco HKS. Juntos são 14/14, o que também cobre o limiar de hooks do L4 (70%).

**Acceptance Criteria**:

1. WHEN `npx harness-score` runs in `agenda` THEN the scanner SHALL pass HKS-01, HKS-02, HKS-03, HKS-04, and HKS-05.
2. The file `agenda/.cursor/hooks.json` SHALL be valid JSON, SHALL include a numeric `version`, and SHALL register `beforeShellExecution` and `afterFileEdit` with non-empty `command` handlers.
3. The file `zenspa/.cursor/hooks.json` SHALL register the same two events, with `command` paths relative to the `zenspa` directory.
4. WHEN the gate script receives a shell command containing `git push --force`, `git reset --hard`, or a recursive delete of a path other than a build directory THEN the script SHALL exit with a deny decision.
5. WHEN the gate script receives `composer test` or `npm run lint` THEN the script SHALL exit with an allow decision.
6. WHEN `afterFileEdit` runs on a file under `zenspa/front` THEN the feedback script SHALL invoke Prettier on that file.
7. IF a hook `command` contains a relative path THEN that path SHALL exist on disk from the `agenda` scan root for the config the scanner selects, and from the `zenspa` workspace for the config Cursor loads.

**Independent Test**: O scan marca HKS-01 a HKS-05 verdes. Executar o script de gate com `git push --force` nega; com `npm run lint` permite.

---

### P2: Subagente e MCP sem segredo

**User Story**: Como agente principal, quero um subagente nomeado para revisão, e uma config MCP que não carregue segredo.

**Why P2**: AGT-01 e AGT-02 estão no relatório (5 pontos). HYG-08 está na história de higiene; aqui o subagente fecha a dimensão de skills.

**Acceptance Criteria**:

1. WHEN `npx harness-score` runs in `agenda` THEN the scanner SHALL pass AGT-01 and AGT-02.
2. The file `zenspa/.cursor/agents/reviewer.md` SHALL contain YAML frontmatter `name` and `description` of at least 40 characters that says when to delegate a review.
3. WHEN that subagent is described THEN the description SHALL tell the parent agent to delegate test and lint review, not feature implementation.

**Independent Test**: O scan marca AGT-01 e AGT-02 verdes. O frontmatter do `reviewer.md` tem `name` e `description`.

---

## Edge Cases

- IF `agenda/package.json` exists and `agenda/package-lock.json` does not THEN the scanner SHALL fail HYG-07, and the change is not done.
- IF a second rule is added with only `alwaysApply: true` and no rule has `globs` THEN the scanner SHALL fail CTX-05.
- IF `.env.example` matches the ignore rule without a negation THEN the scanner still passes HYG-02, and the implementation SHALL keep `!.env.example` so the exemplo continua no git.
- IF hook commands use only `.cursor/hooks/...` inside `agenda/.cursor/hooks.json` THEN HKS-05 SHALL fail, because that path is not at the scan root.
- IF the MIT `LICENSE` is only inside `zenspa/` THEN HYG-05 SHALL fail on a scan of `agenda`.
- WHEN `back/.env` is already ignored by `zenspa/back/.gitignore` THEN the root patterns SHALL still ignore it, and the file SHALL NOT be deleted.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| HS-01 | P1: Contexto | Specify | Pending |
| HS-02 | P1: Contexto | Specify | Implementing |
| HS-03 | P1: Contexto | Specify | Implementing |
| HS-04 | P1: Contexto | Specify | Implementing |
| HS-05 | P1: Contexto | Specify | Implementing |
| HS-06 | P1: Contexto | Specify | Implementing |
| HS-07 | P1: Contexto | Specify | Implementing |
| HS-08 | P1: Skills | Specify | Pending |
| HS-09 | P1: Skills | Specify | Implementing |
| HS-10 | P1: Skills | Specify | Implementing |
| HS-11 | P1: Skills | Specify | Implementing |
| HS-12 | P1: Higiene | Specify | Pending |
| HS-13 | P1: Higiene | Specify | Implementing |
| HS-14 | P1: Higiene | Specify | Implementing |
| HS-15 | P1: Higiene | Specify | Implementing |
| HS-16 | P1: Higiene | Specify | Implementing |
| HS-17 | P1: Higiene | Specify | Implementing |
| HS-18 | P1: Higiene | Specify | Implementing |
| HS-19 | P1: Higiene | Specify | Implementing |
| HS-20 | P2: Sensores | Specify | Pending |
| HS-21 | P2: Sensores | Specify | Pending |
| HS-22 | P2: Sensores | Specify | Pending |
| HS-23 | P2: Sensores | Specify | Pending |
| HS-24 | P2: Sensores | Specify | Pending |
| HS-25 | P2: Sensores | Specify | Pending |
| HS-26 | P2: Sensores | Specify | Pending |
| HS-27 | P2: CI | Specify | Pending |
| HS-28 | P2: CI | Specify | Pending |
| HS-29 | P2: CI | Specify | Pending |
| HS-30 | P2: CI | Specify | Pending |
| HS-31 | P2: CI | Specify | Pending |
| HS-32 | P2: CI | Specify | Pending |
| HS-33 | P2: Hooks | Specify | Pending |
| HS-34 | P2: Hooks | Specify | Pending |
| HS-35 | P2: Hooks | Specify | Pending |
| HS-36 | P2: Hooks | Specify | Pending |
| HS-37 | P2: Hooks | Specify | Pending |
| HS-38 | P2: Hooks | Specify | Pending |
| HS-39 | P2: Hooks | Specify | Pending |
| HS-40 | P2: Subagente | Specify | Pending |
| HS-41 | P2: Subagente | Specify | Pending |
| HS-42 | P2: Subagente | Specify | Pending |

**Coverage:** 42 total, 0 mapped to tasks, 42 unmapped

---

## Success Criteria

- [ ] `npx harness-score` em `agenda` mostra nível L2 ou maior.
- [ ] CTX-03, CTX-04, CTX-05, CTX-06, CTX-07, SKL-01, SKL-02, SKL-03, SKL-04, AGT-01, AGT-02, HKS-01, HKS-02, HKS-03, HKS-04, HKS-05, SNS-01, SNS-03, SNS-04, CI-01, CI-02, CI-03, CI-04, HYG-01, HYG-02, HYG-03, HYG-05 e HYG-08 passam.
- [ ] CTX-01, CTX-02, CTX-08, SNS-02, SNS-05, HYG-04, HYG-06 e HYG-07 continuam passando.
- [ ] `git check-ignore` em `zenspa` ignora `.env.docker`, `front/.env` e `back/.env`, e os três arquivos ainda existem.
