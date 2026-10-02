# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | Ocupação de intervalo do profissional é decidida dentro de uma transação que faz `lockForUpdate` na linha do profissional antes de inserir ou reagendar | MySQL 8 não tem exclusion constraint; índice único em `(professional_id, date, time)` não reabre horário `cancelado` nem expressa cruzamento por `duration_minutes`. MVP-2 reutiliza a mesma trava. | active | 2026-09-30 |

## Handoff

**Feature**: mvp-2-reception-agenda
**Where**: `plan.md` escrito — aguarda revisão humana; `checks.md` ainda não existe
**In progress**: `.specs/features/mvp-2-reception-agenda/plan.md`
**Next step**: confirmar o plano (aba Agenda vs rota SPA; envelope JSON) e só então escrever `checks.md`
**Blockers**: none — defaults em Assumptions com Confirmed? n
**Uncommitted**: none
**Branch**: cursor/mvp-2-reception-agenda-e659
