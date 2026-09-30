# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | Ocupação de intervalo do profissional é decidida dentro de uma transação que faz `lockForUpdate` na linha do profissional antes de inserir ou reagendar | MySQL 8 não tem exclusion constraint; índice único em `(professional_id, date, time)` não reabre horário `cancelado` nem expressa cruzamento por `duration_minutes`. MVP-2 reutiliza a mesma trava. | active | 2026-09-30 |

## Handoff

**Feature**: mvp-2-day-agenda
**Where**: C1–C55 fechados. Verifier PASS em `verification.md`. `validate_verification.py` exit 0.
**In progress**: none
**Next step**: MVP-3 no roadmap
**Blockers**: none
**Uncommitted**: none
**Branch**: master
