# MVP-2 — Agenda do dia e marcação pela recepção

## Problem

A recepção não opera o dia. A aba de agendamentos é uma tabela filtrável de tudo que já foi gravado, inclusive `cancelado`, e não mostra onde ainda cabe alguém. Quem liga ou chega no balcão não entra na agenda: `POST /bookings` grava só o usuário autenticado, sempre `pendente`.

Quem paga é a recepção. Sem a visão do dia ela não confirma, conclui nem encaixa na hora. Sem o `POST` administrativo o cliente de telefone fica de fora até criar conta e passar pelo wizard.

A evidência é o roadmap (revisão 2026-09-30): "A aba atual é uma tabela filtrável. A operação do dia é outra tela." Os testes nomeados ali são 403 para não-admin, admin cria para outro usuário, horário inválido recebe 422, e a agenda do dia não lista cancelados como ocupados. Não há número de atendimento nem prazo.

Com isto, a recepção abre o dia de um profissional ou de todos, vê o que está ocupado e o que a grade ainda oferece, encaixa um usuário que já existe, confirma, conclui e cancela.

## Flow

A agenda e o encaixe reusam `SlotOccupancy` (exists) e o `PUT` e o cancelamento do admin. Não nasce outra definição de intervalo ocupado, nem outra trava além da de AD-001.

1. `GET /admin/agenda` entra em `AdminBookingController` (exists) — lê `Professional` (exists), monta `free_slots` com a mesma omissão de ponto ocupado e de ponto passado no dia corrente que `ProfessionalController::availableSlots` (exists), e devolve os bookings ocupantes ordenados por `time`.
2. `POST /admin/bookings` entra em `AdminBookingController` (exists) — resolve `User` (exists) por `user_id` ou por `email`, e dentro de `SlotOccupancy::run` (exists) persiste `Booking` (exists) e a `Transaction` do tipo `entrada` (exists).
3. A tela `/admin/agenda` (new, no door - placement per conventions) lê esse JSON e chama o `PUT /admin/bookings/{booking}` (exists) e o `POST /admin/bookings/{booking}/cancel` (exists) para confirmar, concluir e cancelar.
4. out: JSON 200 da agenda, 201 do encaixe, ou 422 com `{ message }`.

## Impact

| Front | What changes |
| --- | --- |
| domain | new term: encaixe — a ação da recepção que grava um `Booking` para outro usuário. Não vira status, coluna nem tipo de registro. |
| domain | existing term: horário livre continua o intervalo do MVP-1 (`pendente`, `confirmado`, `concluído`; `cancelado` libera; duração meio-aberta; passado de hoje fora da lista). Quem ramifica hoje: `SlotOccupancy`, `ProfessionalController::availableSlots`, `BookingController::store`, `AdminBookingController::update`. A agenda e o `POST` admin passam a ramificar no mesmo lugar. |
| stored data | nada a migrar. O encaixe insere `bookings` e uma `transactions` do tipo `entrada`, como o `POST` do cliente. `GET /admin/bookings` e a aba de tabela continuam listando `cancelado`. |

## Relations

None - no stored-data shape change

## Surface

| Route | In | Out | Status |
| --- | --- | --- | --- |
| `GET /admin/agenda` | `date` em `Y-m-d`, obrigatório; `professional_id` opcional | `date`; `professionals[]` com `id`, `name`, `bookings[]` (`id`, `time` em `H:i`, `status`, `user`, `service`) e `free_slots[]` de strings `H:i` | 200, 401, 403, 404, 422 |
| `POST /admin/bookings` | exatamente um de `user_id` ou `email`; `service_id`; `professional_id`; `date`; `time` em `H:i`; `payment_method` em `pix`, `cartao_credito`, `cartao_debito`, `dinheiro`; `status` em `pendente` ou `confirmado` | booking com `user_id`, `status`, `price`, `service`, `professional`, `user` | 201, 401, 403, 422 |

## Landing

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| JSON da agenda | `{ "date": "Y-m-d", "professionals": [{ "id", "name", "bookings": [], "free_slots": ["H:i"] }] }`, bookings só com status ocupante e `time` crescente | montar o dia no browser com `GET /admin/bookings` mais `GET /professionals/{id}/slots`: a regra de slot voltaria para o cliente, e o `AGENTS.md` proíbe isso |
| Cliente do encaixe | corpo com exatamente um de `user_id` ou `email` de um usuário já gravado; a linha persiste esse `user_id` | cadastro de cliente no balcão: o roadmap pede usuário existente, e um booking sem `user_id` quebra a listagem do `BookingController`, que filtra pelo dono |

- Nada mais nesta mudança é difícil de reverter. A trava continua a de AD-001.

## Criteria

### S1: A recepção lê o dia (P1)

Um `GET` devolve, por profissional, quem ocupa o dia e quais pontos da grade ainda estão livres.

**Acceptance Criteria**

1. WHEN `GET /admin/agenda?date=2026-10-05` não traz `professional_id` THEN the system SHALL respond 200 with `date` equal to `2026-10-05` and a `professionals` array that includes every professional, each object with `id`, `name`, `bookings` and `free_slots`.
2. WHEN `professional_id` is the id of one professional THEN the system SHALL return 200 with `professionals` of length 1 and that `id`.
3. WHEN two professionals are named `Ana` and `Bruno` THEN the system SHALL order `professionals` with `Ana` before `Bruno`.
4. WHEN a professional has no `Availability` on that weekday THEN the system SHALL still include that professional with `bookings` equal to `[]` and `free_slots` equal to `[]`.
5. WHEN that date has bookings at `11:00` and `09:00` with status `pendente`, `confirmado` or `concluído` THEN the system SHALL list those bookings in `bookings` with `time` `09:00` before `time` `11:00`, each `time` in `H:i`.
6. WHEN that date has a booking with status `cancelado` at `09:00` THEN the system SHALL omit that booking from `bookings`.
7. WHEN `date` is `2026-10-05`, the grid emits `09:00`, `14:00`, `15:00` and `16:00`, a `cancelado` sits at `09:00`, and an occupying booking at `14:00` has `duration_minutes` 120 THEN the system SHALL include `09:00` and `16:00` in `free_slots` and SHALL omit `14:00` and `15:00`.
8. WHEN the application clock is `2026-10-05 15:00:00` UTC and `date` is `2026-10-05` THEN the system SHALL omit a free grid point at `14:00` from `free_slots` and SHALL include a free grid point at `15:00`.
9. WHEN `date` is `2020-01-06` THEN the system SHALL respond 200.
10. IF `date` is absent or is not a calendar date in `Y-m-d` THEN the system SHALL respond 422 with JSON `message` equal to `Data inválida.`
11. IF `professional_id` is `999999` THEN the system SHALL respond 404.
12. IF the caller is unauthenticated THEN the system SHALL respond 401.
13. IF the caller is authenticated and `is_admin` is false THEN the system SHALL respond 403.

**Independent test:** `GET /api/admin/agenda?date=2026-10-05` with two professionals, one cancelled booking, one 120-minute booking, and a non-admin token.

### S2: A recepção grava o encaixe (P1)

O `POST` marca para um usuário que já existe, com a mesma ocupação do `POST /bookings`, e a recepção escolhe `pendente` ou `confirmado`.

**Acceptance Criteria**

14. WHEN an admin sends `POST /admin/bookings` with `user_id` of another user and `status` `pendente` on a free interval THEN the system SHALL respond 201 with `user_id` equal to that other user.
15. WHEN that body sends `status` `pendente` THEN the system SHALL store `status` `pendente`.
16. WHEN that body sends `status` `confirmado` THEN the system SHALL store `status` `confirmado` and respond 201.
17. WHEN the 201 is stored THEN `bookings.price` SHALL equal that service `price`.
18. WHEN the 201 is stored THEN the system SHALL insert one `transactions` row with `type` `entrada`, `booking_id` of that booking, and `amount` equal to that service `price`.
19. WHEN the body sends `email` of an existing user and omits `user_id` THEN the system SHALL respond 201 with `user_id` equal to that user.
20. IF the body omits both `user_id` and `email` THEN the system SHALL respond 422 with JSON `message` equal to `Informe o usuário.` and SHALL insert no `bookings` row.
21. IF the body sends both `user_id` and `email` THEN the system SHALL respond 422 with JSON `message` equal to `Informe só o id ou o e-mail.` and SHALL insert no `bookings` row.
22. IF no user has that `user_id` or that `email` THEN the system SHALL respond 422 with JSON `message` equal to `Usuário não encontrado.` and SHALL insert no `bookings` row.
23. IF `status` is `cancelado`, `concluído`, or absent THEN the system SHALL respond 422 with JSON `message` equal to `Status inicial inválido.` and SHALL insert no `bookings` row.
24. IF `payment_method` is absent or is not `pix`, `cartao_credito`, `cartao_debito` or `dinheiro` THEN the system SHALL respond 422 with JSON `message` equal to `Forma de pagamento inválida.` and SHALL insert no `bookings` row.
25. IF the interval crosses an occupying booking of the same professional on the same date THEN the system SHALL respond 422 with JSON `message` equal to `Horário já reservado.` and SHALL insert no `bookings` row.
26. IF that overlap response is returned THEN the system SHALL insert no `transactions` row for the request.
27. IF `[time, time + duration_minutes)` does not fit inside one `Availability` window THEN the system SHALL respond 422 with JSON `message` equal to `Horário fora da disponibilidade do profissional.` and SHALL insert no `bookings` row.
28. IF `date` is the application clock's day and `time` is earlier than that clock THEN the system SHALL respond 422 with JSON `message` equal to `Horário já passou.` and SHALL insert no `bookings` row.
29. IF `date` is before the application clock's day THEN the system SHALL respond 422 with JSON `message` equal to `Não é possível agendar em data passada.` and SHALL insert no `bookings` row.
30. WHEN two `POST /admin/bookings` race on overlapping intervals of the same professional and date THEN the system SHALL persist exactly one occupying booking and SHALL respond 422 with JSON `message` equal to `Horário já reservado.` to the other request.
31. IF the caller is unauthenticated THEN the system SHALL respond 401.
32. IF the caller is authenticated and `is_admin` is false THEN the system SHALL respond 403 and SHALL insert no `bookings` row.

**Independent test:** `POST /api/admin/bookings` as admin for another user's id and email, then the same call as a non-admin and against an occupied `09:00`.

### S3: A tela do dia (P2)

`/admin/agenda` mostra o JSON e dispara encaixe, confirmação, conclusão e cancelamento.

**Acceptance Criteria**

33. WHEN `/admin` is shown THEN the screen SHALL show a control named `Agenda do dia` that navigates to `/admin/agenda`.
34. WHEN `/admin/agenda` is waiting for `GET /admin/agenda` THEN the screen SHALL show the text `Carregando agenda...`.
35. IF `GET /admin/agenda` fails THEN the screen SHALL show that error message and SHALL not show a booking time.
36. WHEN every professional in the 200 has `bookings` `[]` and `free_slots` `[]` THEN the screen SHALL show the text `Nenhum horário neste dia.`
37. WHEN `bookings` lists `09:00` then `11:00` THEN the screen SHALL show `09:00` before `11:00`.
38. WHEN a booking has status `pendente` THEN the screen SHALL show buttons `Confirmar` and `Cancelar` for that booking.
39. WHEN a booking has status `confirmado` THEN the screen SHALL show buttons `Concluir` and `Cancelar` for that booking.
40. WHEN a booking has status `concluído` THEN the screen SHALL show none of the buttons `Confirmar`, `Concluir` and `Cancelar` for that booking.
41. WHEN the user activates `Confirmar` on a `pendente` booking THEN the screen SHALL show that booking as `confirmado`.
42. WHEN the user activates `Concluir` on a `confirmado` booking THEN the screen SHALL show that booking as `concluído`.
43. WHEN the user accepts `window.confirm` with the text `Cancelar agendamento?` THEN the screen SHALL drop that booking from the day.
44. WHEN the user activates `Encaixar` on free slot `09:00` THEN the screen SHALL open a form showing `09:00`, with a status control whose only options are `pendente` and `confirmado`.
45. IF the client field has neither `@` nor an integer THEN the screen SHALL show `Informe o e-mail ou o id do cliente.` and SHALL not call `POST /admin/bookings`.
46. WHEN the form submit is in flight THEN the screen SHALL show `Salvando...` and SHALL not send a second `POST /admin/bookings`.
47. IF `POST /admin/bookings` responds 422 THEN the form SHALL stay open and SHALL show that response `message`.
48. WHEN `POST /admin/bookings` responds 201 THEN the form SHALL close and the screen SHALL show the new booking time.
49. WHEN `/admin/agenda` first loads THEN the date control SHALL hold the browser's local calendar day as `Y-m-d`.

**Independent test:** open `/admin/agenda` with one pending booking and one free slot, confirm it, then submit the encaixe form against a 422.

## Out of scope

| Excluded | Why |
| --- | --- |
| Cadastrar o cliente no balcão | o roadmap limita o encaixe a usuário existente |
| Substituir a aba de tabela | `GET /admin/bookings` continua a lista filtrável, inclusive `cancelado` |
| Bloqueios pontuais (MVP-3) | a grade semanal segue o único calendário |
| Antecedência no cancelamento e estorno (MVP-4) | cancelar neste item só muda o status, como o cancelamento admin já faz |
| Agenda do profissional autenticado (MVP-5) | sem vínculo `professionals.user_id` |
| E-mail, tela de perfil, PIX e webhook | o roadmap só abre isso com o MVP fechado |
| `service_id` na lista de `free_slots` | a lista segue o `GET` público; a duração do serviço novo é barrada no `POST` |

## Assumptions

| Assumption | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Caixa do e-mail | `where('email', $email)`, igual ao login, sem normalizar maiúsculas | a collation do MySQL e a do SQLite de teste não prometem o mesmo resultado | n |

**Open questions:** none - all resolved or logged above.

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| screen `/admin/agenda` | empty state | AC 36 |
| screen `/admin/agenda` | loading | AC 34 |
| screen `/admin/agenda` | error state | AC 35 |
| screen `/admin/agenda` | unauthorised | existing - `PrivateRoute` com `adminOnly` manda anônimo para `/login` e não-admin para `/` |
| screen `/admin/agenda` | ordering | AC 3, AC 5, AC 37 |
| screen `/admin/agenda` | destructive action confirms | AC 43 |
| screen form de encaixe | error state | AC 45, AC 47 |
| screen form de encaixe | empty state | n/a - o formulário abre num horário já escolhido, não é uma lista |
| screen form de encaixe | loading | AC 46 |
| screen form de encaixe | unauthorised | n/a - a rota inteira já cai no `PrivateRoute` |
| API `GET /admin/agenda` | error shape and codes | AC 10, AC 11, AC 12, AC 13 |
| API `GET /admin/agenda` | who may call | AC 12, AC 13 |
| API `POST /admin/bookings` | error shape and codes | AC 20, AC 21, AC 22, AC 23, AC 24, AC 25, AC 27, AC 28, AC 29, AC 31, AC 32 |
| API `POST /admin/bookings` | who may call | AC 31, AC 32 |
| API `GET /admin/agenda` and `POST /admin/bookings` | versioning, rate limits | n/a - rotas novas sem prefixo de versão e sem throttle além do que o grupo admin já não tem |
| collection `professionals` | grouping | AC 1 |
| collection `professionals` | naming | existing - o `name` já gravado em `professionals` |
| collection `professionals` | ordering | AC 3 |
| collection `professionals` | duplicates | n/a - `professionals.id` já é único |
| collection `professionals` | exception that does not fit | AC 4 |

## Sources

- `.specs/implementation-roadmap.md` seção MVP-2 — o `GET` da agenda, o `POST` para outro usuário, e a tela do dia
- `.specs/STATE.md` AD-001 — a trava que o `POST` admin reutiliza
- `AGENTS.md` — status canônicos e middleware `admin`
