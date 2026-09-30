# MVP-1 — Integridade dos horários

## Problem

A agenda oferece e grava horário que não está livre. Quem marca pelo wizard, e quem reagenda no admin, paga com dois atendimentos no mesmo intervalo ou com um horário que já passou.

Hoje `GET /professionals/{id}/slots` esconde qualquer `time` gravado, inclusive `cancelado`, e ignora `duration_minutes`. `POST /bookings` só recusa o mesmo `time` e já ignora `cancelado`, então a lista e a gravação discordam. Um serviço de 120 minutos às 09:00 não ocupa 10:00. Horário de hoje anterior ao relógio da aplicação continua na lista e o `POST` aceita. `PUT /admin/bookings/{booking}` grava profissional, data ou hora sem olhar grade nem conflito. Não há trava entre duas gravações do mesmo intervalo.

A evidência é o próprio roadmap (revisão 2026-09-30): "A agenda mente enquanto um horário cancelado, sobreposto ou passado puder ser marcado." O exemplo do roadmap — serviço de 120 minutos às 09:00 "bloqueia 10:00 e 11:00" — entra abaixo como intervalo meio-aberto, então 11:00 continua livre.

Com isto, cliente e recepção só concluem horário que a grade e os atendimentos ativos realmente deixam livre.

## Flow

A lista, o `POST /bookings` e o `PUT` do admin passam a usar a mesma ocupação de intervalo. Não nasce um segundo calculador de slot.

1. `GET /professionals/{id}/slots` entra em `ProfessionalController` (exists) — omite `time` anterior ao relógio da aplicação no dia corrente e omite ponto da grade que cai em `[time, time + duration_minutes)` de booking `pendente`, `confirmado` ou `concluído`; devolve o array `H:i`.
2. `POST /bookings` entra em `BookingController` (exists) — a mesma ocupação, dentro da transação que trava a linha do profissional (door 1), e persiste `Booking` (exists) mais a `Transaction` do tipo `entrada` (exists).
3. `PUT /admin/bookings/{booking}` entra em `AdminBookingController` (exists) — se o corpo traz `professional_id`, `date` ou `time`, a mesma ocupação, excluindo o próprio booking; mudança só de `status` não revalida a grade.
4. out: `422` com `{ message }` ou o JSON do booking; `Step3Confirm` (exists) e o modal de agendamento em `AdminDashboard` (exists) mostram esse `message`.

## Impact

| Front | What changes |
| --- | --- |
| domain | existing term: horário livre era "o `time` não é igual ao de nenhum booking", inclusive `cancelado`. Passa a ser "o intervalo meio-aberto não cruza booking `pendente`, `confirmado` ou `concluído`". Quem ramifica hoje: `ProfessionalController::availableSlots`, `BookingController::store`, `AdminBookingController::update`, e o wizard via `api.getAvailableSlots`. |
| stored data | nada a migrar. Status fora desses três, inclusive o default da coluna `confirmed`, não ocupa intervalo. |

## Relations

None - no stored-data shape change

## Surface

None - nothing consumed outside

`GET /professionals/{id}/slots`, `POST /bookings` e `PUT /admin/bookings/{booking}` mantêm caminho, entrada e códigos. O `422` com `{ message }` já existe no `POST` e na validação do `PUT`; conflito e grade passam a usar esse mesmo status.

## Landing

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| Trava da ocupação | `DB::transaction` e, antes da checagem e da escrita, `Professional::query()->whereKey($id)->lockForUpdate()->first()` | índice único em `(professional_id, date, time)`: `cancelado` precisa reutilizar esse início, e 120 minutos às 09:00 cruzam outro `time`, o que esse índice não expressa |
| Trava no SQLite | No driver `sqlite`, a mesma transação usa `transaction_mode` `IMMEDIATE` e `PRAGMA busy_timeout = 5000` antes do `lockForUpdate` | `transaction_mode` `IMMEDIATE` global em `config/database.php`: mudaria toda transação sqlite, não só a gravação do horário |

- Nada mais nesta mudança é difícil de reverter.

## Criteria

### S1: A lista só mostra horário livre (P1)

O `GET` público devolve os pontos da grade que ainda podem ser o início de um atendimento.

**Acceptance Criteria**

1. WHEN `GET /professionals/{id}/slots` encontra, nesse profissional e data, um booking com status `cancelado` THEN o sistema SHALL incluir o `time` desse booking no array JSON 200 de strings `H:i`.
2. WHEN um booking às `09:00` tem `duration_minutes` 120 e a grade emite `09:00`, `10:00` e `11:00` THEN o sistema SHALL omitir `09:00` e `10:00` do array 200.
3. WHEN um booking às `09:00` tem `duration_minutes` 120 e a grade emite `11:00` THEN o sistema SHALL incluir `11:00` no array 200.
4. WHEN `date` é a data corrente do relógio da aplicação e um ponto da grade é anterior a esse relógio THEN o sistema SHALL omitir esse ponto do array 200.
5. WHILE o status do booking é `pendente`, `confirmado` ou `concluído` o sistema SHALL tratar `[time, time + duration_minutes)` como ocupado naquele profissional e naquela data.

**Independent test:** `GET /api/professionals/{id}/slots?date=` com um cancelado, um serviço de 120 minutos e um horário de hoje já passado.

### S2: O cliente não grava horário mentiroso (P1)

O `POST /bookings` recusa o que a lista não ofereceria e o que a duração não cabe na grade.

**Acceptance Criteria**

6. IF o intervalo pedido cruza um booking ocupante do mesmo profissional na mesma data THEN `POST /bookings` SHALL responder 422 com JSON `message` igual a `Horário já reservado.`
7. IF o intervalo pedido cruza um booking ocupante THEN o sistema SHALL não inserir linha em `bookings` para esse pedido.
8. IF `date` é a data corrente e `time` é anterior ao relógio da aplicação THEN `POST /bookings` SHALL responder 422 com JSON `message` igual a `Horário já passou.`
9. IF `[time, time + duration_minutes)` não cabe inteiro em uma única janela de `Availability` daquele profissional naquele dia da semana THEN `POST /bookings` SHALL responder 422 com JSON `message` igual a `Horário fora da disponibilidade do profissional.`
10. WHEN dois `POST /bookings` disputam intervalos sobrepostos do mesmo profissional na mesma data THEN o sistema SHALL persistir exatamente um booking ocupante e SHALL responder 422 ao outro pedido.
11. WHEN o intervalo cabe numa janela, não cruza ocupante e não é anterior ao relógio da aplicação THEN `POST /bookings` SHALL responder 201.

**Independent test:** `POST /api/bookings` autenticado, com grade de segunda 09:00–18:00, serviço de 60 e de 120 minutos.

### S3: O admin reagenda com a mesma regra (P1)

Mudar profissional, data ou hora passa pela mesma ocupação. Mudar só o status não passa.

**Acceptance Criteria**

12. IF `PUT /admin/bookings/{booking}` muda `professional_id`, `date` ou `time` para um intervalo que cruza outro ocupante THEN o sistema SHALL responder 422 com `message` igual a `Horário já reservado.` e SHALL manter `professional_id`, `date` e `time` anteriores.
13. IF essa mudança cai fora de toda janela de disponibilidade THEN o sistema SHALL responder 422 com `message` igual a `Horário fora da disponibilidade do profissional.` e SHALL manter `professional_id`, `date` e `time` anteriores.
14. WHEN o corpo muda apenas `status` THEN `PUT /admin/bookings/{booking}` SHALL responder 200 sem exigir janela de disponibilidade.
15. WHEN o intervalo novo é o intervalo atual do próprio booking THEN `PUT /admin/bookings/{booking}` SHALL responder 200.
16. WHEN um admin grava `date` de hoje e `time` anterior ao relógio da aplicação, com o intervalo dentro da grade e livre de outros bookings, THEN `PUT /admin/bookings/{booking}` SHALL responder 200.
17. IF `time` vem no corpo e não casa com `H:i` THEN `PUT /admin/bookings/{booking}` SHALL responder 422.

**Independent test:** `PUT /api/admin/bookings/{id}` com admin, um alvo ocupado e um alvo só de status.

### S4: A recusa aparece na tela (P2)

O 422 deixa de ser um alerta genérico no wizard e um modal que fecha mesmo assim no admin.

**Acceptance Criteria**

18. WHEN `POST /bookings` responde 422 THEN `Step3Confirm` SHALL mostrar o `message` dessa resposta e SHALL não navegar para `/agendar/sucesso`.
19. WHEN `PUT /admin/bookings/{booking}` responde 422 THEN o modal de agendamento do admin SHALL permanecer aberto e SHALL mostrar o `message` dessa resposta.

**Independent test:** confirmar um horário sobreposto no wizard e salvar um reagendamento ocupado no modal do admin.

## Out of scope

| Excluded | Why |
| --- | --- |
| Agenda do dia e encaixe pela recepção (MVP-2) | outro `POST` e outra tela; passa a usar a trava da door 1 |
| Bloqueios pontuais (MVP-3) | a grade semanal segue o único calendário |
| Antecedência no cancelamento e estorno (MVP-4) | cancelar não mexe no caixa neste item |
| Agenda do profissional autenticado (MVP-5) | sem vínculo `professionals.user_id` |
| E-mail, tela de perfil, PIX e webhook | o roadmap só abre isso com o MVP fechado |
| `service_id` na query de slots | a lista não muda de assinatura; a duração do serviço novo é barrada no `POST` e no `PUT` |
| Trocar `app.timezone` | o "agora" continua o relógio já configurado |

## Assumptions

| Assumption | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Relógio do "agora" | comparar com o relógio de `config/app.php`, hoje `UTC`, sem alterar o timezone | mudar o timezone desloca o dia corrente do resto da API | n |
| Lista sem serviço | `GET /professionals/{id}/slots` continua só com `date` | a ocupação vem dos bookings já gravados; caber na grade é regra de escrita | n |

**Open questions:** none - all resolved or logged above.

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| screen passo do profissional | empty state | existing - copy `Sem horários disponíveis para este dia.` |
| screen passo do profissional | loading | existing - copy `Carregando horários...` |
| screen passo do profissional | error | existing - falha do fetch só vai para `console.error` e a lista fica vazia |
| screen `Step3Confirm` | error state | AC 18 |
| screen `Step3Confirm` | empty, loading, unauthorized | n/a - a tela só revisa a seleção já feita; 401 continua no `auth:sanctum` |
| screen modal de agendamento no admin | error state | AC 19 |
| screen modal de agendamento no admin | empty, loading | n/a - o modal edita um booking já aberto |
| screen admin, cancelar e excluir | destructive action confirms | existing - `window.confirm` antes de cancelar ou excluir |
| API `GET /professionals/{id}/slots` | error shape and codes | existing - sem `date` responde 400 `{ message: Date is required }`; profissional ausente responde 404 |
| API `POST /bookings` | error shape and codes | AC 6, AC 8, AC 9 |
| API `PUT /admin/bookings/{booking}` | error shape and codes | AC 12, AC 13, AC 17 |
| API `GET` slots, `POST /bookings`, `PUT` admin | versioning, rate limits | n/a - nenhuma rota nova e nenhum throttle novo |
| API `GET` slots | who may call | existing - rota pública |
| API `POST /bookings` | who may call | existing - `auth:sanctum` |
| API `PUT /admin/bookings/{booking}` | who may call | existing - `auth:sanctum` + `admin` |

## Sources

- `.specs/implementation-roadmap.md` seção MVP-1 — o que a lista, o `POST`, o `PUT` e a corrida têm de passar a fazer
- `AGENTS.md` — status `pendente`, `confirmado`, `cancelado`, `concluído` e middleware `admin`
