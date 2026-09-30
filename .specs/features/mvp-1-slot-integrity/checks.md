# MVP-1 — Integridade dos horários — checks

Profile: light
Plan: `.specs/features/mvp-1-slot-integrity/plan.md`

27 checks in 4 slices · 1 one-way door · 0 open

Proofs de API rodam no PHP do container `zenspa-api` (`docker-compose.dev.yml`). O `phpunit.xml` fixa SQLite em memória; o comando não aponta para o MySQL de desenvolvimento.

## Checks

### S1 - Lista pública · ProfessionalController, ocupação, SlotListTest · ~13 KB · ~3k

**C1** - `GET /professionals/{id}/slots` com um booking `cancelado` às `09:00` devolve 200 e o array inclui `09:00` (S1, AC 1)
Proof: `docker exec zenspa-api php artisan test --filter=test_cancelled_booking_time_is_listed`

**C2** - Com booking às `09:00` de `duration_minutes` 120 e a grade emitindo `09:00`, `10:00` e `11:00`, o 200 omite `09:00` e `10:00` (S1, AC 2)
Proof: `docker exec zenspa-api php artisan test --filter=test_one_hundred_twenty_minutes_hides_09_and_10`

**C3** - No mesmo caso, o 200 inclui `11:00` (S1, AC 3)
Proof: `docker exec zenspa-api php artisan test --filter=test_one_hundred_twenty_minutes_keeps_11`

**C4** - Com o relógio da aplicação em `2026-09-30 15:00:00` UTC e `date=2026-09-30`, o 200 omite `14:00` e inclui `15:00` (S1, AC 4)
Proof: `docker exec zenspa-api php artisan test --filter=test_past_grid_point_on_today_is_omitted`

**C5** - Cada status `pendente`, `confirmado` e `concluído` omite o ponto da grade que cai em `[time, time + duration_minutes)` (S1, AC 5)
Proof: `docker exec zenspa-api php artisan test --filter=test_occupying_status_hides_grid_point`

**C6** - Um booking com status `confirmed` às `09:00` não ocupa: o 200 inclui `09:00` (Impact)
Proof: `docker exec zenspa-api php artisan test --filter=test_english_confirmed_status_does_not_occupy`

**C7** - `GET /professionals/{id}/slots` sem `date` responde 400 com `message` `Date is required` (Observable)
Proof: `docker exec zenspa-api php artisan test --filter=test_slots_without_date_are_400`

**C8** - `GET /professionals/999999/slots?date=2026-10-05` responde 404 (Observable)
Proof: `docker exec zenspa-api php artisan test --filter=test_slots_for_missing_professional_are_404`

### S2 - POST do cliente · BookingController, ocupação, BookingStoreTest · ~14 KB · ~3k

**C9** - Intervalo que cruza um ocupante no mesmo profissional e data: `POST /bookings` responde 422 e `message` é `Horário já reservado.` (S2, AC 6)
Proof: `docker exec zenspa-api php artisan test --filter=test_overlapping_post_returns_reserved_message`

**C10** - Nesse 422, a tabela `bookings` não ganha linha do pedido (S2, AC 7)
Proof: `docker exec zenspa-api php artisan test --filter=test_overlapping_post_inserts_nothing`

**C11** - `date` igual ao dia do relógio `2026-09-30 15:00:00` UTC e `time` `14:00`: `POST /bookings` responde 422 e `message` é `Horário já passou.` (S2, AC 8)
Proof: `docker exec zenspa-api php artisan test --filter=test_past_time_today_is_rejected`

**C12** - `[time, time + duration_minutes)` que não cabe inteiro numa única janela de `Availability`: `POST /bookings` responde 422 e `message` é `Horário fora da disponibilidade do profissional.` (S2, AC 9)
Proof: `docker exec zenspa-api php artisan test --filter=test_interval_outside_one_window_is_rejected`

**C13** - Dois `POST /bookings` simultâneos com intervalos sobrepostos do mesmo profissional e data: exatamente um booking ocupante persiste e o outro responde 422 com `message` `Horário já reservado.` (S2, AC 10)
Proof: `docker exec zenspa-api php artisan test --filter=test_concurrent_overlapping_posts_persist_one`

**C14** - Intervalo dentro de uma janela, sem cruzar ocupante e não anterior ao relógio: `POST /bookings` responde 201 (S2, AC 11)
Proof: `docker exec zenspa-api php artisan test --filter=test_free_interval_returns_201`

**C15** - `POST /bookings` no mesmo `time` de um booking `cancelado` responde 201 (S1, AC 1 na escrita)
Proof: `docker exec zenspa-api php artisan test --filter=test_post_on_cancelled_time_returns_201`

**C16** - `POST /bookings` no mesmo `time` de um booking `confirmed` responde 201 (Impact)
Proof: `docker exec zenspa-api php artisan test --filter=test_post_on_english_confirmed_returns_201`

**C17** - `POST /bookings` sem autenticação responde 401 (Observable)
Proof: `docker exec zenspa-api php artisan test --filter=test_guest_post_booking_is_401`

### S3 - PUT do admin · AdminBookingController, ocupação, AdminRescheduleTest · ~13 KB · ~3k

**C18** - `PUT /admin/bookings/{booking}` que muda `professional_id`, `date` ou `time` para um intervalo que cruza outro ocupante responde 422 com `message` `Horário já reservado.` e mantém `professional_id`, `date` e `time` anteriores (S3, AC 12)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_reschedule_onto_occupant_keeps_previous_slot`

**C19** - Essa mudança fora de toda janela responde 422 com `message` `Horário fora da disponibilidade do profissional.` e mantém `professional_id`, `date` e `time` anteriores (S3, AC 13)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_reschedule_outside_window_keeps_previous_slot`

**C20** - Corpo só com `status`, e zero linhas em `availabilities`: `PUT /admin/bookings/{booking}` responde 200 (S3, AC 14)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_status_only_update_returns_200_without_window`

**C21** - Corpo com o mesmo intervalo do próprio booking: `PUT /admin/bookings/{booking}` responde 200 (S3, AC 15)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_put_own_interval_returns_200`

**C22** - Admin grava `date` `2026-09-30` e `time` `14:00` com relógio `2026-09-30 15:00:00` UTC, intervalo dentro da grade e sem outro booking: responde 200 (S3, AC 16)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_may_save_past_time_today`

**C23** - `time` `9am` no corpo: `PUT /admin/bookings/{booking}` responde 422 (S3, AC 17)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_time_must_match_hi`

**C24** - `PUT /admin/bookings/{booking}` sem autenticação responde 401 (Observable)
Proof: `docker exec zenspa-api php artisan test --filter=test_guest_put_admin_booking_is_401`

**C25** - `PUT /admin/bookings/{booking}` com usuário não admin responde 403 (Observable)
Proof: `docker exec zenspa-api php artisan test --filter=test_non_admin_put_booking_is_403`

### S4 - Recusa na tela · Step3Confirm, modal do admin · ~20 KB · ~20k

**C26** - Quando `POST /bookings` responde 422 com `message` `Horário já reservado.`, `Step3Confirm` mostra esse texto e não navega para `/agendar/sucesso` (S4, AC 18)
Proof: `npm test -- -t step3_shows_422_message_and_stays`

**C27** - Quando `PUT /admin/bookings/{booking}` responde 422 com `message` `Horário já reservado.`, o modal `Gerenciar Agendamento` permanece aberto e mostra esse texto (S4, AC 19)
Proof: `npm test -- -t admin_modal_stays_open_on_422`

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| occupying status (3) | `pendente` C5 · `confirmado` C5 · `concluído` C5 | - |
| non-occupying status (2) | `cancelado` C1 · `confirmed` C6 | - |
| `GET /professionals/{id}/slots` statuses (3) | 200 C1 · 400 C7 · 404 C8 | - |
| `POST /bookings` statuses (3) | 201 C14 · 422 C9 · 401 C17 | - |
| `PUT /admin/bookings/{booking}` statuses (4) | 200 C20 · 422 C18 · 401 C24 · 403 C25 | - |
| grid points under a 120-minute 09:00 booking (3) | `09:00` C2 · `10:00` C2 · `11:00` C3 | - |
| POST rejection messages (3) | `Horário já reservado.` C9 · `Horário já passou.` C11 · `Horário fora da disponibilidade do profissional.` C12 | - |
| PUT rejection messages (2) | `Horário já reservado.` C18 · `Horário fora da disponibilidade do profissional.` C19 | - |
| occupancy lock (1) | `lockForUpdate` C13 | - |

- Claims naming a status code, route or response shape: C1, C7, C8, C9, C11, C12, C14, C17, C18, C19, C20, C23, C24, C25 - each has a proof that crosses the boundary
- No other check claims more than the single case its proof exercises

## Swept

- validation: C7, C12, C23
- failure modes: C9, C10, C11, C26, C27
- idempotency: n/a - não há entrega repetida; a segunda gravação do mesmo intervalo está em concorrência
- authorization: existing - `auth:sanctum` no POST e `auth:sanctum` mais middleware `admin` no PUT; C17, C24, C25
- concurrency: C13
- data lifecycle: n/a - nenhuma retenção, expiração ou migração de linha
- dependency failure: n/a - esta mudança não chama serviço externo
- state transitions: C5, C20
- observability: n/a - sem requisito de log nesta mudança

## Handoff

Medido com o tamanho dos arquivos que cada fatia toca, dividido por 4. Arquivos novos ainda fora do disco entram com folga explícita.

- S1 = 4861 B já no disco (`ProfessionalController.php` 2741, `Booking.php` 841, `Service.php` 367, `Availability.php` 361, `Professional.php` 551) + 8 KB de ocupação e teste ≈ 13 KB → ~3k
- S2 soma `BookingController.php` 3482 e `BookingTest.php` 3973 + 6 KB de teste ≈ 14 KB → ~3k; acumulado ~7k
- S3 soma `AdminBookingController.php` 1904 e `AdminBookingTest.php` 4750 + 6 KB de teste ≈ 13 KB → ~3k; acumulado ~10k
- S4 entra na UI em `AdminDashboard.jsx` 51736, `BookingConfirmStep.jsx` 8044, `api.js` 7735, `Step3Confirm.jsx` 1419, `BookingContext.jsx` 982, `package.json` 781, `vite.config.js` 161 + 8 KB de teste ≈ 79 KB → ~20k; acumulado ~30k, abaixo do orçamento de 150k — one builder

- **Boundary:** C1–C27 fechados neste conjunto de commits
- **Settled mid-build:** provas de API usam `docker exec zenspa-api php artisan test`. No SQLite, a transação da ocupação usa `IMMEDIATE` porque `lockForUpdate` não trava linha.
- **Abandoned:** índice único em `(professional_id, date, time)` — já rejeitado no plano.
