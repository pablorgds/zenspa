# MVP-2 — Agenda do dia — checks

Profile: light
Plan: `.specs/features/mvp-2-day-agenda/plan.md`

55 checks in 3 slices · 2 one-way doors · 0 open

Proofs de API rodam no PHP do container `zenspa-api` (`docker-compose.dev.yml`). O `phpunit.xml` fixa SQLite em memória; o comando não aponta para o MySQL de desenvolvimento. Proofs de tela rodam em `front/`.

## Checks

### S1 - Agenda do dia · AdminBookingController, SlotOccupancy, ProfessionalController, DayAgendaTest · ~27 KB · ~7k

**C1** - `GET /admin/agenda?date=2026-10-05` sem `professional_id` responde 200, `date` é `2026-10-05`, e `professionals` inclui cada profissional gravado, cada objeto com `id`, `name`, `bookings` e `free_slots` (S1, AC 1)
Proof: `docker exec zenspa-api php artisan test --filter=test_agenda_lists_every_professional`

**C2** - `professional_id` igual ao id de um profissional: 200, `professionals` tem length 1 e esse `id` (S1, AC 2)
Proof: `docker exec zenspa-api php artisan test --filter=test_agenda_filters_one_professional`

**C3** - Com profissionais `Ana` e `Bruno`, `professionals` traz `Ana` antes de `Bruno` (S1, AC 3)
Proof: `docker exec zenspa-api php artisan test --filter=test_agenda_orders_ana_before_bruno`

**C4** - Profissional sem `Availability` nesse dia da semana continua em `professionals`, com `bookings` `[]` e `free_slots` `[]` (S1, AC 4)
Proof: `docker exec zenspa-api php artisan test --filter=test_agenda_includes_professional_without_availability`

**C5** - Para cada status `pendente`, `confirmado` e `concluído`, bookings às `11:00` e `09:00` aparecem em `bookings` com `time` `09:00` antes de `time` `11:00`; o objeto das `09:00` tem `id`, `status` igual a esse status, `user` e `service`, e cada `time` em `H:i` (S1, AC 5)
Proof: `docker exec zenspa-api php artisan test --filter=test_agenda_lists_occupying_bookings_by_time`

**C6** - Booking `cancelado` às `09:00` não entra em `bookings` (S1, AC 6)
Proof: `docker exec zenspa-api php artisan test --filter=test_agenda_omits_cancelled_booking`

**C7** - Em `2026-10-05`, com a grade emitindo `09:00`, `14:00`, `15:00` e `16:00`, um `cancelado` às `09:00` e um ocupante às `14:00` de `duration_minutes` 120, `free_slots` inclui `09:00` e `16:00` e omite `14:00` e `15:00` (S1, AC 7)
Proof: `docker exec zenspa-api php artisan test --filter=test_agenda_free_slots_skip_cancel_and_overlap`

**C8** - Relógio `2026-10-05 15:00:00` UTC e `date` `2026-10-05`: `free_slots` omite o ponto livre `14:00` e inclui o ponto livre `15:00` (S1, AC 8)
Proof: `docker exec zenspa-api php artisan test --filter=test_agenda_omits_past_grid_point_today`

**C9** - `date` `2020-01-06` responde 200 (S1, AC 9)
Proof: `docker exec zenspa-api php artisan test --filter=test_agenda_past_date_is_200`

**C10** - Sem `date`: 422 e `message` `Data inválida.` (S1, AC 10)
Proof: `docker exec zenspa-api php artisan test --filter=test_agenda_without_date_is_422`

**C11** - `date` `2026-13-40`: 422 e `message` `Data inválida.` (S1, AC 10)
Proof: `docker exec zenspa-api php artisan test --filter=test_agenda_invalid_date_is_422`

**C12** - `professional_id` `999999`: 404 (S1, AC 11)
Proof: `docker exec zenspa-api php artisan test --filter=test_agenda_missing_professional_is_404`

**C13** - Sem autenticação: `GET /admin/agenda` responde 401 (S1, AC 12)
Proof: `docker exec zenspa-api php artisan test --filter=test_guest_get_agenda_is_401`

**C14** - Autenticado com `is_admin` false: `GET /admin/agenda` responde 403 (S1, AC 13)
Proof: `docker exec zenspa-api php artisan test --filter=test_non_admin_get_agenda_is_403`

### S2 - Encaixe · AdminBookingController, SlotOccupancy, AdminEncaixeTest · ~21 KB · ~5k

**C15** - Admin envia `POST /admin/bookings` com `user_id` de outro usuário, `status` `pendente` e intervalo livre: 201 e `user_id` igual a esse outro usuário (S2, AC 14)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_for_other_user_returns_201`

**C16** - Esse corpo com `status` `pendente` grava `status` `pendente` (S2, AC 15)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_stores_pendente`

**C17** - Corpo com `status` `confirmado` grava `status` `confirmado` e responde 201 (S2, AC 16)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_stores_confirmado`

**C18** - No 201, `bookings.price` é `150.00`, igual ao `price` do serviço (S2, AC 17)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_copies_service_price`

**C19** - No 201, nasce uma linha em `transactions` com `type` `entrada`, `booking_id` desse booking e `amount` `150.00` (S2, AC 18)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_inserts_entrada`

**C20** - Corpo com `email` de usuário existente e sem `user_id`: 201 e `user_id` igual a esse usuário (S2, AC 19)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_by_email_returns_201`

**C21** - Corpo sem `user_id` e sem `email`: 422, `message` `Informe o usuário.`, e nenhuma linha nova em `bookings` (S2, AC 20)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_without_user_is_422`

**C22** - Corpo com `user_id` e `email`: 422, `message` `Informe só o id ou o e-mail.`, e nenhuma linha nova em `bookings` (S2, AC 21)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_with_id_and_email_is_422`

**C23** - `user_id` `999999` sem usuário: 422, `message` `Usuário não encontrado.`, e nenhuma linha nova em `bookings` (S2, AC 22)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_unknown_user_id_is_422`

**C24** - `email` `ausente@example.com` sem usuário: 422, `message` `Usuário não encontrado.`, e nenhuma linha nova em `bookings` (S2, AC 22)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_unknown_email_is_422`

**C25** - `status` `cancelado`: 422, `message` `Status inicial inválido.`, e nenhuma linha nova em `bookings` (S2, AC 23)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_rejects_cancelado`

**C26** - `status` `concluído`: 422, `message` `Status inicial inválido.`, e nenhuma linha nova em `bookings` (S2, AC 23)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_rejects_concluido`

**C27** - Sem `status`: 422, `message` `Status inicial inválido.`, e nenhuma linha nova em `bookings` (S2, AC 23)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_rejects_absent_status`

**C28** - `payment_method` `pix`, `cartao_credito`, `cartao_debito` e `dinheiro`, cada um num intervalo livre, responde 201 (Surface)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_accepts_each_payment_method`

**C29** - Sem `payment_method`: 422, `message` `Forma de pagamento inválida.`, e nenhuma linha nova em `bookings` (S2, AC 24)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_rejects_absent_payment`

**C30** - `payment_method` `boleto`: 422, `message` `Forma de pagamento inválida.`, e nenhuma linha nova em `bookings` (S2, AC 24)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_rejects_boleto`

**C31** - Intervalo que cruza um ocupante do mesmo profissional na mesma data: 422, `message` `Horário já reservado.`, e nenhuma linha nova em `bookings` (S2, AC 25)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_overlap_is_422`

**C32** - Nesse 422 de cruzamento, nenhuma linha nova em `transactions` (S2, AC 26)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_overlap_inserts_no_transaction`

**C33** - `[time, time + duration_minutes)` que não cabe numa janela de `Availability`: 422, `message` `Horário fora da disponibilidade do profissional.`, e nenhuma linha nova em `bookings` (S2, AC 27)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_outside_window_is_422`

**C34** - Relógio `2026-10-05 15:00:00` UTC, `date` `2026-10-05` e `time` `14:00`: 422, `message` `Horário já passou.`, e nenhuma linha nova em `bookings` (S2, AC 28)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_past_time_today_is_422`

**C35** - Relógio `2026-10-05 15:00:00` UTC e `date` `2026-10-04`: 422, `message` `Não é possível agendar em data passada.`, e nenhuma linha nova em `bookings` (S2, AC 29)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_past_date_is_422`

**C36** - Dois `POST /admin/bookings` simultâneos em intervalos sobrepostos do mesmo profissional e data: persiste exatamente um booking ocupante, e o outro responde 422 com `message` `Horário já reservado.` (S2, AC 30)
Proof: `docker exec zenspa-api php artisan test --filter=test_admin_post_race_persists_one`

**C37** - `POST /admin/bookings` sem autenticação responde 401 (S2, AC 31)
Proof: `docker exec zenspa-api php artisan test --filter=test_guest_post_admin_booking_is_401`

**C38** - Autenticado com `is_admin` false: `POST /admin/bookings` responde 403 e não insere linha em `bookings` (S2, AC 32)
Proof: `docker exec zenspa-api php artisan test --filter=test_non_admin_post_admin_booking_is_403`

### S3 - Tela do dia · /admin/agenda · ~90 KB · ~22k

**C39** - `/admin` mostra um controle `Agenda do dia` que navega para `/admin/agenda` (S3, AC 33)
Proof: `npm test -- -t agenda_do_dia_link_goes_to_agenda`

**C40** - Enquanto `GET /admin/agenda` não resolve, a tela mostra `Carregando agenda...` (S3, AC 34)
Proof: `npm test -- -t agenda_shows_loading`

**C41** - Quando `GET /admin/agenda` falha com `message` `Data inválida.`, a tela mostra `Data inválida.` e não mostra `09:00` (S3, AC 35)
Proof: `npm test -- -t agenda_shows_error_without_booking_time`

**C42** - Quando todo profissional do 200 tem `bookings` `[]` e `free_slots` `[]`, a tela mostra `Nenhum horário neste dia.` (S3, AC 36)
Proof: `npm test -- -t agenda_shows_empty_day`

**C43** - Quando `bookings` lista `09:00` e depois `11:00`, a tela mostra `09:00` antes de `11:00` (S3, AC 37)
Proof: `npm test -- -t agenda_shows_09_before_11`

**C44** - Booking `pendente` mostra os botões `Confirmar` e `Cancelar` (S3, AC 38)
Proof: `npm test -- -t agenda_pendente_shows_confirmar_and_cancelar`

**C45** - Booking `confirmado` mostra os botões `Concluir` e `Cancelar` (S3, AC 39)
Proof: `npm test -- -t agenda_confirmado_shows_concluir_and_cancelar`

**C46** - Booking `concluído` não mostra os botões `Confirmar`, `Concluir` e `Cancelar` (S3, AC 40)
Proof: `npm test -- -t agenda_concluido_shows_no_action_buttons`

**C47** - Ativar `Confirmar` num booking `pendente` mostra esse booking como `confirmado` (S3, AC 41)
Proof: `npm test -- -t agenda_confirmar_shows_confirmado`

**C48** - Ativar `Concluir` num booking `confirmado` mostra esse booking como `concluído` (S3, AC 42)
Proof: `npm test -- -t agenda_concluir_shows_concluido`

**C49** - Aceitar `window.confirm` com o texto `Cancelar agendamento?` tira o booking `09:00` do dia (S3, AC 43)
Proof: `npm test -- -t agenda_cancel_drops_booking`

**C50** - Ativar `Encaixar` no horário livre `09:00` abre um formulário que mostra `09:00` e um controle de status cujas únicas opções são `pendente` e `confirmado` (S3, AC 44)
Proof: `npm test -- -t agenda_encaixar_opens_form_for_09`

**C51** - Campo do cliente com `cliente` mostra `Informe o e-mail ou o id do cliente.` e não chama `POST /admin/bookings` (S3, AC 45)
Proof: `npm test -- -t agenda_encaixe_rejects_client_without_post`

**C52** - Com o submit em voo, a tela mostra `Salvando...` e envia um único `POST /admin/bookings` (S3, AC 46)
Proof: `npm test -- -t agenda_encaixe_shows_salvando_once`

**C53** - `POST /admin/bookings` 422 com `message` `Horário já reservado.` mantém o formulário aberto e mostra `Horário já reservado.` (S3, AC 47)
Proof: `npm test -- -t agenda_encaixe_stays_open_on_422`

**C54** - `POST /admin/bookings` 201 fecha o formulário e a tela mostra o horário `09:00` do booking novo (S3, AC 48)
Proof: `npm test -- -t agenda_encaixe_closes_on_201`

**C55** - Na primeira carga, com o dia local do browser em `2026-10-05`, o controle de data vale `2026-10-05` (S3, AC 49)
Proof: `npm test -- -t agenda_date_defaults_to_local_day`

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| occupying status in agenda (3) | `pendente` C5 · `confirmado` C5 · `concluído` C5 | - |
| `GET /admin/agenda` statuses (5) | 200 C1 · 401 C13 · 403 C14 · 404 C12 · 422 C10 | - |
| `GET /admin/agenda` date errors (2) | absent C10 · `2026-13-40` C11 | - |
| professional name order (2) | `Ana` C3 · `Bruno` C3 | - |
| free_slots under 120 minutes at 14:00 (4) | `09:00` C7 · `14:00` C7 · `15:00` C7 · `16:00` C7 | - |
| today grid vs 15:00 UTC (2) | `14:00` C8 · `15:00` C8 | - |
| `POST /admin/bookings` statuses (4) | 201 C15 · 401 C37 · 403 C38 · 422 C21 | - |
| encaixe client (4) | `user_id` C15 · `email` C20 · neither C21 · both C22 | - |
| unknown user (2) | `user_id` C23 · `email` C24 | - |
| initial status (5) | `pendente` C16 · `confirmado` C17 · `cancelado` C25 · `concluído` C26 · absent C27 | - |
| payment_method accepted (4) | C28, table-driven over all 4 | - |
| payment_method rejected (2) | absent C29 · `boleto` C30 | - |
| POST rejection messages (9) | `Informe o usuário.` C21 · `Informe só o id ou o e-mail.` C22 · `Usuário não encontrado.` C23 · `Status inicial inválido.` C25 · `Forma de pagamento inválida.` C29 · `Horário já reservado.` C31 · `Horário fora da disponibilidade do profissional.` C33 · `Horário já passou.` C34 · `Não é possível agendar em data passada.` C35 | - |
| screen actions by status (3) | `pendente` C44 · `confirmado` C45 · `concluído` C46 | - |
| screen transitions (3) | `Confirmar` C47 · `Concluir` C48 · `Cancelar` C49 | - |
| encaixe form outcomes (3) | invalid client C51 · 422 C53 · 201 C54 | - |
| Landing doors (2) | agenda JSON C1 · encaixe client C15 | - |
| occupancy lock (1) | `lockForUpdate` C36 | - |

- Claims naming a status code, route or response shape: C1, C10, C11, C12, C13, C14, C15, C17, C21, C22, C23, C24, C25, C26, C27, C29, C30, C31, C33, C34, C35, C36, C37, C38, C53 - each has a proof that crosses the boundary
- No other check claims more than the single case its proof exercises

## Swept

- validation: C10, C11, C21, C25, C29, C33, C51
- failure modes: C31, C32, C41, C53
- idempotency: n/a - não há entrega repetida; a segunda gravação do mesmo intervalo está em concorrência
- authorization: existing - `auth:sanctum` e middleware `admin`; C13, C14, C37, C38
- concurrency: C36
- data lifecycle: n/a - nenhuma retenção, expiração ou migração; o encaixe só insere
- dependency failure: n/a - esta mudança não chama serviço externo
- state transitions: C16, C17, C47, C48, C49
- observability: n/a - sem requisito de log nesta mudança

## Handoff

Medido com o tamanho dos arquivos que cada fatia toca, dividido por 4. Arquivos novos ainda fora do disco entram com folga explícita. Acumulado sem contar duas vezes o que a fatia anterior já segurou.

- S1 = 15113 B já no disco (`AdminBookingController.php` 3634, `ProfessionalController.php` 2961, `SlotOccupancy.php` 4069, `Professional.php` 551, `Availability.php` 361, `Booking.php` 841, `api.php` 2696) + 12 KB de `DayAgendaTest` ≈ 27 KB → ~7k
- S2 soma `BookingController.php` 3651, `User.php` 1058, `Transaction.php` 350, `Service.php` 367 + 16 KB de `AdminEncaixeTest` ≈ 21 KB → ~5k; acumulado ~12k
- S3 entra na UI em `AdminDashboard.jsx` 52212, `api.js` 7830, `App.jsx` 3162 + 8 KB da tela e 18 KB de teste ≈ 90 KB → ~22k; acumulado ~34k, abaixo do orçamento de 150k — one builder
