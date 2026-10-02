# MVP-3 — Bloqueios pontuais — checks

Profile: light
Plan: `.specs/features/mvp-3-punctual-blocks/plan.md`

35 checks in 5 slices · 2 one-way doors · 0 open

Proofs de API rodam no PHP do container `zenspa-api` (`docker-compose.dev.yml`). O `phpunit.xml` fixa SQLite em memória. Proofs de tela rodam em `front/` com Vitest.

## Checks

### S1 - CRUD do bloqueio · Professional, api.php, Block, AdminBlockController, ProfessionalBlockTest · ~27 KB · ~7k

**C1** - Admin `POST /admin/professionals/{id}/blocks` com `starts_at` `2026-10-05 12:00:00`, `ends_at` `2026-10-05 14:00:00` e `reason` `Folga`, sem ocupante: 201, `professional_id` igual a `{id}`, `reason` `Folga`, e a linha persiste esse intervalo (S1, AC 1)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_block_returns_201`

**C2** - `GET /admin/professionals/{id}/blocks` com dois bloqueios responde 200 com os dois objetos, cada um com `id`, `professional_id`, `starts_at`, `ends_at` e `reason`, ordenados por `starts_at` crescente (S1, AC 2)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_lists_blocks_by_starts_at`

**C3** - `PUT /admin/professionals/{id}/blocks/{block}` com `reason` `Consulta médica` responde 200 e persiste `reason` `Consulta médica` (S1, AC 3)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_put_block_reason`

**C4** - `DELETE /admin/professionals/{id}/blocks/{block}` responde 204 e a linha some (S1, AC 4)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_delete_block_is_204`

**C5** - `POST` com `ends_at` igual a `starts_at` `2026-10-05 12:00:00` responde 422 e não insere linha (S1, AC 5)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_block_equal_bounds_is_422`

**C6** - `PUT` com `ends_at` igual a `starts_at` `2026-10-05 12:00:00` responde 422 e mantém `ends_at` anterior (S1, AC 5)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_put_block_equal_bounds_is_422`

**C7** - `POST` com `reason` `""` responde 422 e não insere linha (S1, AC 6)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_block_empty_reason_is_422`

**C8** - `{professional}` `999999`: `GET`, `POST`, `PUT` e `DELETE` em `/admin/professionals/999999/blocks` respondem 404 (S1, AC 7)
Proof: `docker exec zenspa-api php artisan test --filter=test_missing_professional_blocks_are_404`

**C9** - `PUT` de um `{block}` que pertence a outro profissional responde 404 (S1, AC 8)
Proof: `docker exec zenspa-api php artisan test --filter=test_put_block_of_other_professional_is_404`

**C10** - `DELETE` de um `{block}` que pertence a outro profissional responde 404 (S1, AC 8)
Proof: `docker exec zenspa-api php artisan test --filter=test_delete_block_of_other_professional_is_404`

**C11** - Sem token, `GET`, `POST`, `PUT` e `DELETE` de `/admin/professionals/{id}/blocks` respondem 401 (S1, AC 9)
Proof: `docker exec zenspa-api php artisan test --filter=test_guest_block_routes_are_401`

**C12** - Autenticado com `is_admin` false, as quatro rotas respondem 403 e o `POST` não insere linha (S1, AC 10)
Proof: `docker exec zenspa-api php artisan test --filter=test_non_admin_block_routes_are_403`

### S2 - Grade sem o intervalo · SlotOccupancy, ProfessionalController, AdminBookingController, ProfessionalBlockSlotTest · ~16 KB · ~4k

**C13** - `Block` `[2026-10-05 00:00:00, 2026-10-06 00:00:00)` e grade de segunda 09:00–18:00: `GET /professionals/{id}/slots?date=2026-10-05` responde 200 com array `[]` (S2, AC 11)
Proof: `docker exec zenspa-api php artisan test --filter=test_full_day_block_hides_all_slots`

**C14** - `Block` `[2026-10-05 12:00:00, 2026-10-05 14:00:00)` e grade com `11:00`, `12:00`, `13:00`, `14:00`: o 200 inclui `11:00` e `14:00` e omite `12:00` e `13:00` (S2, AC 12)
Proof: `docker exec zenspa-api php artisan test --filter=test_partial_block_keeps_11_and_14`

**C15** - O mesmo bloqueio e a mesma grade: `GET /admin/agenda?date=2026-10-05` tem `free_slots` que omitem `12:00` e `13:00` e incluem `11:00` e `14:00` (S2, AC 13)
Proof: `docker exec zenspa-api php artisan test --filter=test_agenda_free_slots_omit_partial_block`

**C16** - Booking `cancelado` às `12:00` e o bloqueio do C14: `free_slots` da agenda ainda omite `12:00` (S2, AC 14)
Proof: `docker exec zenspa-api php artisan test --filter=test_cancelled_booking_does_not_lift_block`

### S3 - Marcação recusa o bloqueio · BookingController, AdminBookingController, BookingBlockTest · ~23 KB · ~6k

**C17** - `POST /bookings` cujo `[time, time + duration_minutes)` cruza um `Block`: 422, `message` `Horário bloqueado.`, e nenhuma linha nova em `bookings` (S3, AC 15)
Proof: `docker exec zenspa-api php artisan test --filter=test_client_post_on_block_is_422`

**C18** - `POST /admin/bookings` no mesmo cruzamento: 422, `message` `Horário bloqueado.`, e nenhuma linha nova em `bookings` (S3, AC 16)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_on_block_is_422`

**C19** - `PUT /admin/bookings/{booking}` que muda `time` para um intervalo que cruza um `Block`: 422, `message` `Horário bloqueado.`, e `professional_id`, `date` e `time` anteriores permanecem (S3, AC 17)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_put_onto_block_keeps_previous_slot`

**C20** - `PUT` só com `status` `confirmado`, booking atual cruzando um `Block`: 200 (S3, AC 18)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_status_put_on_blocked_booking_is_200`

**C21** - `POST /bookings` às `09:00` com `duration_minutes` 120 e `Block` `[2026-10-05 10:00:00, 2026-10-05 11:00:00)`: 422, `message` `Horário bloqueado.` (S3, AC 19)
Proof: `docker exec zenspa-api php artisan test --filter=test_client_post_120_crossing_block_is_422`

**C22** - `POST /bookings` em intervalo livre, sem cruzar bloqueio nem ocupante, dentro da janela: 201 (S3, AC 20)
Proof: `docker exec zenspa-api php artisan test --filter=test_client_post_beside_block_returns_201`

### S4 - Bloqueio não apaga ocupante · AdminBlockController, ProfessionalBlockConflictTest · ~10 KB · ~3k

**C23** - `POST /admin/professionals/{id}/blocks` sobre um ocupante: 422, `message` `Intervalo com agendamento ativo.`, `booking_ids` contém exatamente o `id` desse ocupante, e o bloqueio não é inserido (S4, AC 21)
Proof: `docker exec zenspa-api php artisan test --filter=test_post_block_over_occupant_returns_ids`

**C24** - Cada status `pendente`, `confirmado` e `concluído` no intervalo produz o 422 do C23, com o `id` desse booking em `booking_ids` (S4, AC 21)
Proof: `docker exec zenspa-api php artisan test --filter=test_post_block_over_each_occupying_status`

**C25** - Único booking no intervalo com status `cancelado`: `POST` do bloqueio responde 201 e persiste a linha (S4, AC 22)
Proof: `docker exec zenspa-api php artisan test --filter=test_post_block_over_cancelled_returns_201`

**C26** - `PUT` que desloca um bloqueio já gravado para cima de um ocupante: 422, `message` `Intervalo com agendamento ativo.`, `booking_ids` contém o `id` do ocupante, e `starts_at` e `ends_at` anteriores permanecem (S4, AC 23)
Proof: `docker exec zenspa-api php artisan test --filter=test_put_block_onto_occupant_keeps_interval`

**C27** - `POST` recusado, `PUT` recusado e `DELETE` 204 de bloqueio deixam `status` do booking ocupante inalterado (S4, AC 24)
Proof: `docker exec zenspa-api php artisan test --filter=test_block_writes_do_not_change_booking_status`

### S5 - Aba Disponibilidades · AdminDashboard, api.js · ~72 KB · ~18k

**C28** - Com um profissional selecionado na aba Disponibilidades, a tela chama `GET /admin/professionals/{id}/blocks` e mostra `starts_at`, `ends_at` e `reason` do bloqueio devolvido (S5, AC 25)
Proof: `npm test -- -t blocks_tab_shows_interval_and_reason`

**C29** - Lista vazia: a tela mostra `Nenhum bloqueio cadastrado.` (S5, AC 26)
Proof: `npm test -- -t blocks_tab_shows_empty`

**C30** - Enquanto o GET não resolve, a tela mostra `Carregando bloqueios...` (S5, AC 27)
Proof: `npm test -- -t blocks_tab_shows_loading`

**C31** - Quando o GET falha, a tela mostra `Não foi possível carregar os bloqueios.` (S5, AC 28)
Proof: `npm test -- -t blocks_tab_shows_load_error`

**C32** - Enviar o formulário de bloqueio novo chama `POST /admin/professionals/{id}/blocks` com `starts_at`, `ends_at` e `reason` (S5, AC 29)
Proof: `npm test -- -t blocks_form_posts_starts_ends_reason`

**C33** - Enviar o formulário de um bloqueio já listado chama `PUT /admin/professionals/{id}/blocks/{block}` com `starts_at`, `ends_at` e `reason` (S5, AC 29)
Proof: `npm test -- -t blocks_form_puts_starts_ends_reason`

**C34** - `POST` 422 com `message` `Intervalo com agendamento ativo.` mantém o formulário aberto e mostra `Intervalo com agendamento ativo.` (S5, AC 30)
Proof: `npm test -- -t blocks_form_stays_open_on_422`

**C35** - Aceitar `window.confirm` chama `DELETE /admin/professionals/{id}/blocks/{block}` (S5, AC 31)
Proof: `npm test -- -t blocks_confirm_delete_calls_delete`

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| `GET /admin/professionals/{professional}/blocks` statuses (4) | 200 C2 · 401 C11 · 403 C12 · 404 C8 | - |
| `POST /admin/professionals/{professional}/blocks` statuses (5) | 201 C1 · 401 C11 · 403 C12 · 404 C8 · 422 C5 | - |
| `PUT /admin/professionals/{professional}/blocks/{block}` statuses (5) | 200 C3 · 401 C11 · 403 C12 · 404 C9 · 422 C6 | - |
| `DELETE /admin/professionals/{professional}/blocks/{block}` statuses (4) | 204 C4 · 401 C11 · 403 C12 · 404 C10 | - |
| guest 401 across block verbs (4) | C11, table-driven over all 4 | - |
| non-admin 403 across block verbs (4) | C12, table-driven over all 4 | - |
| missing professional 404 across block verbs (4) | C8, table-driven over all 4 | - |
| occupying status vs POST block (3) | `pendente` C24 · `confirmado` C24 · `concluído` C24 | - |
| block write vs booking status (3) | `POST` C27 · `PUT` C27 · `DELETE` C27 | - |
| half-open grid 12:00–14:00 (4) | `11:00` C14 · `12:00` C14 · `13:00` C14 · `14:00` C14 | - |
| `POST /bookings` vs block (2) | 422 C17 · 201 C22 | - |
| Landing doors (2) | intervalo persistido C1 · JSON `booking_ids` C23 | - |
| Relations `Block` (1) | C1 | - |

- Claims naming a status code, route or response shape: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C15, C17, C18, C19, C20, C21, C22, C23, C25, C26, C34 - each has a proof that crosses the boundary
- No other check claims more than the single case its proof exercises

## Swept

- validation: C5, C6, C7
- failure modes: C17, C23, C34
- idempotency: n/a - não há chave de entrega; dois POST no mesmo intervalo criam duas linhas (assumption do plano)
- authorization: C11, C12
- concurrency: existing - `SlotOccupancy::run` / AD-001 na escrita de booking e na checagem de ocupante ao gravar o bloqueio; o plano não exige prova de corrida neste item
- data lifecycle: C4, C27 — delete remove só o `Block`; nenhum `Booking` é apagado ou muda `status`
- dependency failure: n/a - esta mudança não chama serviço externo
- state transitions: C20, C24, C25
- observability: n/a - sem requisito de log nesta mudança

## Handoff

Medido com o tamanho dos arquivos que cada fatia toca, dividido por 4. Arquivos novos ainda fora do disco entram com folga explícita. Acumulado sem contar duas vezes o que a fatia anterior já segurou.

- S1 = 1999 B (`AdminAvailabilityController.php` como teto do CRUD) + 551 (`Professional.php`) + 2816 (`api.php`) + 8 KB controller/model/migration novos + 14 KB `ProfessionalBlockTest` ≈ 27 KB → ~7k
- S2 soma `SlotOccupancy.php` 5355, `ProfessionalController.php` 1768 + 8 KB de teste ≈ 16 KB → ~4k; acumulado ~11k
- S3 entra em `BookingController.php` 3651 e `AdminBookingController.php` 9462 + 10 KB de teste ≈ 23 KB → ~6k; acumulado ~17k
- S4 reusa o POST/PUT do S1; + 10 KB `ProfessionalBlockConflictTest` ≈ 10 KB → ~3k; acumulado ~20k
- S5 entra na UI em `AdminDashboard.jsx` 51511, `api.js` 8380 + 12 KB de teste ≈ 72 KB → ~18k; acumulado ~38k, abaixo do orçamento de 150k — one builder
- Mechanism: one builder

- **Boundary:** C1–C27 closed at `8f34cd9`; C28–C35 closed at `e1dd717`
- **Settled mid-build:** JSON de `starts_at`/`ends_at` no GET é `Y-m-d H:i:s`, o mesmo formato do corpo
- **Abandoned:** none
