# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | Ocupação de intervalo do profissional é decidida dentro de uma transação que faz `lockForUpdate` na linha do profissional antes de inserir ou reagendar | MySQL 8 não tem exclusion constraint; índice único em `(professional_id, date, time)` não reabre horário `cancelado` nem expressa cruzamento por `duration_minutes`. MVP-2 reutiliza a mesma trava. | active | 2026-09-30 |

## Handoff

**Feature**: mvp-2-day-agenda
**Where**: C1–C55 no código. API em `8bd4243`. Provas verdes. Falta o Verifier.
**In progress**: none
**Next step**: Verifier independente sobre `6498bc6..HEAD`
**Blockers**: none
**Uncommitted**: none
**Branch**: master
