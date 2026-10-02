# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | Ocupação de intervalo do profissional é decidida dentro de uma transação que faz `lockForUpdate` na linha do profissional antes de inserir ou reagendar | MySQL 8 não tem exclusion constraint; índice único em `(professional_id, date, time)` não reabre horário `cancelado` nem expressa cruzamento por `duration_minutes`. MVP-2 reutiliza a mesma trava. | active | 2026-09-30 |
| AD-002 | Bloqueio pontual é um intervalo meio-aberto `[starts_at, ends_at)` de um profissional; grade e escrita de booking descontam esse intervalo. Gravá-lo recusa ocupante sem apagar `Booking` e devolve `booking_ids`. | a grade semanal (`Availability`) não expressa folga de um dia; apagar ocupante perderia histórico. MVP-4 e MVP-5 reusam o mesmo intervalo. | active | 2026-10-02 |

## Handoff

**Feature**: mvp-3-punctual-blocks
**Where**: C1–C35 implementados — provas PHP e Vitest verdes neste ambiente
**In progress**: none
**Next step**: Verifier sobre `6a9aa53..HEAD`
**Blockers**: none
**Uncommitted**: none
**Branch**: cursor/mvp-3-punctual-blocks-plan-27b6
