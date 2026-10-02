# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | Ocupação de intervalo do profissional é decidida dentro de uma transação que faz `lockForUpdate` na linha do profissional antes de inserir ou reagendar | MySQL 8 não tem exclusion constraint; índice único em `(professional_id, date, time)` não reabre horário `cancelado` nem expressa cruzamento por `duration_minutes`. MVP-2 reutiliza a mesma trava. | active | 2026-09-30 |

## Handoff

**Feature**: mvp-2-day-agenda
**Where**: `plan.md` escrito — sem `checks.md` até revisão humana
**In progress**: `.specs/features/mvp-2-day-agenda/plan.md`
**Next step**: confirmar o plano; depois derivar `checks.md`
**Blockers**: revisão humana do plano
**Uncommitted**: none
**Branch**: cursor/mvp-2-day-agenda-plan-27b6
