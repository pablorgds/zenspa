# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | Ocupação de intervalo do profissional é decidida dentro de uma transação que faz `lockForUpdate` na linha do profissional antes de inserir ou reagendar | MySQL 8 não tem exclusion constraint; índice único em `(professional_id, date, time)` não reabre horário `cancelado` nem expressa cruzamento por `duration_minutes`. MVP-2 reutiliza a mesma trava. | active | 2026-09-30 |

## Handoff

**Feature**: mvp-1-slot-integrity
**Where**: C1–C27 com prova verde no PHP do container `zenspa-api` e no `npm test` do front
**In progress**: commits da feature
**Next step**: verificação independente
**Blockers**: none
**Uncommitted**: plano, checks, API, testes e telas
**Branch**: conferir no commit
