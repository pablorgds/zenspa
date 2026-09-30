# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | Ocupação de intervalo do profissional é decidida dentro de uma transação que faz `lockForUpdate` na linha do profissional antes de inserir ou reagendar | MySQL 8 não tem exclusion constraint; índice único em `(professional_id, date, time)` não reabre horário `cancelado` nem expressa cruzamento por `duration_minutes`. MVP-2 reutiliza a mesma trava. | active | 2026-09-30 |

## Handoff

**Feature**: mvp-1-slot-integrity
**Where**: C1–C27 verificados — `verification.md` PASS, `validate_verification.py` exit 0
**In progress**: none
**Next step**: none para este item
**Blockers**: none
**Uncommitted**: none
**Branch**: master, commits `1506ab7` `c4e7e96` `6efa64e` `0a67325`
