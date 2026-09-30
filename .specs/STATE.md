# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | Ocupação de intervalo do profissional é decidida dentro de uma transação que faz `lockForUpdate` na linha do profissional antes de inserir ou reagendar | MySQL 8 não tem exclusion constraint; índice único em `(professional_id, date, time)` não reabre horário `cancelado` nem expressa cruzamento por `duration_minutes`. MVP-2 reutiliza a mesma trava. | active | 2026-09-30 |

## Handoff

**Feature**: mvp-2-day-agenda
**Where**: `checks.md` escrito — `validate_checks.py` exit 0. Profile light. Estimativa ~34k, one builder.
**In progress**: none
**Next step**: testes e implementação de C1–C55
**Blockers**: none
**Uncommitted**: `.specs/features/mvp-2-day-agenda/plan.md`, `.specs/features/mvp-2-day-agenda/checks.md`
**Branch**: master
