# MVP-1 slot integrity verification

**Verdict**: PASS
**Profile**: light
**Diff range**: e7dfed8..6efa64e
**Round**: 1 - full
**Verifier**: independent sub-agent (author != verifier)

Profile `light` re-ran the proofs at `HEAD`, located one assertion per check, judged level and sampling, and re-read `Swept` rows that say `existing`. Fault injection, the Coverage recompute, Test policy verdicts, and binding-source comparison did not run.

## Checks

| Check | Claim | Proof run | Evidence | Result |
| --- | --- | --- | --- | --- |
| C1 | 200 includes `09:00` when the booking is `cancelado` | batched `php artisan test --filter` exit 0; printed `✓ cancelled booking time is listed` | `back/tests/Feature/SlotIntegrityTest.php:28` books `Booking::STATUS_CANCELLED` (`cancelado`); `:32` `$response->assertOk()`; `:33` `$this->assertContains('09:00', $response->json())` | PASS |
| C2 | 200 omits `09:00` and `10:00` for a 120-minute booking at `09:00` | same run exit 0; printed `✓ one hundred twenty minutes hides 09 and 10` | `back/tests/Feature/SlotIntegrityTest.php:43` `$response->assertOk()`; `:44` `$this->assertNotContains('09:00', $response->json())`; `:45` `$this->assertNotContains('10:00', $response->json())` | PASS |
| C3 | 200 includes `11:00` in that same case | same run exit 0; printed `✓ one hundred twenty minutes keeps 11` | `back/tests/Feature/SlotIntegrityTest.php:55` `$response->assertOk()`; `:56` `$this->assertContains('11:00', $response->json())` | PASS |
| C4 | clock `2026-09-30 15:00:00`, `date=2026-09-30`: 200 omits `14:00` and includes `15:00` | same run exit 0; printed `✓ past grid point on today is omitted` | `back/tests/Feature/SlotIntegrityTest.php:61` `Carbon::setTestNow('2026-09-30 15:00:00')`; `:74` `$this->assertNotContains('14:00', $response->json())`; `:75` `$this->assertContains('15:00', $response->json())` | PASS |
| C5 | each of `pendente`, `confirmado`, `concluído` omits the grid point inside `[time, time + duration_minutes)` | same run exit 0; printed `✓ occupying status hides grid point with data set "pendente"`, `"confirmado"`, and `"concluído"` | `back/tests/Feature/SlotIntegrityTest.php:327` provider keys `pendente`, `confirmado`, `concluído` pass `Booking::STATUS_PENDING`, `STATUS_CONFIRMED`, `STATUS_COMPLETED` (those constants are `pendente`, `confirmado`, `concluído`); `:86` `$response->assertOk()->assertExactJson(['11:00'])` | PASS |
| C6 | status `confirmed` does not occupy: 200 includes `09:00` | same run exit 0; printed `✓ english confirmed status does not occupy` | `back/tests/Feature/SlotIntegrityTest.php:92` books `'confirmed'`; `:97` `$this->assertContains('09:00', $response->json())` | PASS |
| C7 | slots without `date` are 400 with `message` `Date is required` | same run exit 0; printed `✓ slots without date are 400` | `back/tests/Feature/SlotIntegrityTest.php:105` `->assertStatus(400)`; `:106` `->assertJsonPath('message', 'Date is required')` | PASS |
| C8 | missing professional is 404 | same run exit 0; printed `✓ slots for missing professional are 404` | `back/tests/Feature/SlotIntegrityTest.php:111` `getJson('/api/professionals/999999/slots?date=2026-10-05')`; `:112` `->assertNotFound()` | PASS |
| C9 | overlapping `POST /bookings` is 422 with `message` `Horário já reservado.` | same run exit 0; printed `✓ overlapping post returns reserved message` | `back/tests/Feature/SlotIntegrityTest.php:122` `->assertStatus(422)`; `:123` `->assertJsonPath('message', 'Horário já reservado.')` | PASS |
| C10 | that 422 inserts no bookings row | same run exit 0; printed `✓ overlapping post inserts nothing` | `back/tests/Feature/SlotIntegrityTest.php:133` `->assertStatus(422)`; `:135` `$this->assertSame(1, Booking::query()->where('professional_id', $pro->id)->count())` after the single occupant booked at `:129` | PASS |
| C11 | today `14:00` against clock `2026-09-30 15:00:00` is 422 with `message` `Horário já passou.` | same run exit 0; printed `✓ past time today is rejected` | `back/tests/Feature/SlotIntegrityTest.php:140` `Carbon::setTestNow('2026-09-30 15:00:00')`; `:145` `->assertStatus(422)`; `:146` `->assertJsonPath('message', 'Horário já passou.')` | PASS |
| C12 | interval that does not fit one window is 422 with `message` `Horário fora da disponibilidade do profissional.` | same run exit 0; printed `✓ interval outside one window is rejected` | `back/tests/Feature/SlotIntegrityTest.php:155` `->assertStatus(422)`; `:156` `->assertJsonPath('message', 'Horário fora da disponibilidade do profissional.')` | PASS |
| C13 | two overlapping posts: one occupying booking persists, the other is 422 with `message` `Horário já reservado.` | same run exit 0; printed `✓ concurrent overlapping posts persist one` | `back/tests/Feature/ConcurrentBookingTest.php:102` `$this->assertSame([201, 422], $statuses, $detail)`; `:105` `$this->assertSame('Horário já reservado.', $rejected['body']['message'] ?? null, $detail)`; `:106` `$this->assertSame(1, Booking::query()->where('professional_id', $pro->id)->whereDate('date', $date)->whereIn('status', SlotOccupancy::OCCUPYING)->count())` | PASS |
| C14 | a free in-window interval is 201 | same run exit 0; printed `✓ free interval returns 201` | `back/tests/Feature/SlotIntegrityTest.php:165` `->assertStatus(201)` | PASS |
| C15 | `POST /bookings` on a `cancelado` time is 201 | same run exit 0; printed `✓ post on cancelled time returns 201` | `back/tests/Feature/SlotIntegrityTest.php:171` books `Booking::STATUS_CANCELLED`; `:175` `->assertStatus(201)` | PASS |
| C16 | `POST /bookings` on a `confirmed` time is 201 | same run exit 0; printed `✓ post on english confirmed returns 201` | `back/tests/Feature/SlotIntegrityTest.php:181` books `'confirmed'`; `:185` `->assertStatus(201)` | PASS |
| C17 | guest `POST /bookings` is 401 | same run exit 0; printed `✓ guest post booking is 401` | `back/tests/Feature/SlotIntegrityTest.php:190` `$this->postJson('/api/bookings', [])->assertUnauthorized()` | PASS |
| C18 | reschedule onto an occupant is 422 with `message` `Horário já reservado.` and keeps `professional_id`, `date`, and `time` | same run exit 0; printed `✓ admin reschedule onto occupant keeps previous slot` | `back/tests/Feature/SlotIntegrityTest.php:206` `->assertStatus(422)`; `:207` `->assertJsonPath('message', 'Horário já reservado.')`; `:209` `$this->assertDatabaseHas('bookings', ['id' => $booking->id, 'professional_id' => $pro->id, 'date' => $date, 'time' => '14:00'])` | PASS |
| C19 | reschedule outside every window is 422 with `message` `Horário fora da disponibilidade do profissional.` and keeps the previous slot | same run exit 0; printed `✓ admin reschedule outside window keeps previous slot` | `back/tests/Feature/SlotIntegrityTest.php:227` `->assertStatus(422)`; `:228` `->assertJsonPath('message', 'Horário fora da disponibilidade do profissional.')`; `:230` `$this->assertDatabaseHas('bookings', ['id' => $booking->id, 'professional_id' => $pro->id, 'date' => $date, 'time' => '14:00'])` | PASS |
| C20 | status-only body with zero availability rows is 200 | same run exit 0; printed `✓ admin status only update returns 200 without window` | `back/tests/Feature/SlotIntegrityTest.php:243` `$this->assertSame(0, Availability::query()->count())`; `:249` `->assertOk()` | PASS |
| C21 | putting the booking's own interval is 200 | same run exit 0; printed `✓ admin put own interval returns 200` | `back/tests/Feature/SlotIntegrityTest.php:259` body sends the same `professional_id`, `date` `2026-10-05`, and `time` `09:00`; `:264` `->assertOk()` | PASS |
| C22 | admin may save today `14:00` at clock `2026-09-30 15:00:00` and gets 200 | same run exit 0; printed `✓ admin may save past time today` | `back/tests/Feature/SlotIntegrityTest.php:269` `Carbon::setTestNow('2026-09-30 15:00:00')`; `:283` `'date' => '2026-09-30'`; `:284` `'time' => '14:00'`; `:286` `->assertOk()` | PASS |
| C23 | body `time` `9am` is 422 | same run exit 0; printed `✓ admin time must match hi` | `back/tests/Feature/SlotIntegrityTest.php:296` `'time' => '9am'`; `:298` `->assertStatus(422)` | PASS |
| C24 | guest `PUT /admin/bookings/{booking}` is 401 | same run exit 0; printed `✓ guest put admin booking is 401` | `back/tests/Feature/SlotIntegrityTest.php:308` `$this->putJson('/api/admin/bookings/1', ['status' => 'confirmado'])->assertUnauthorized()` | PASS |
| C25 | non-admin `PUT` is 403 | same run exit 0; printed `✓ non admin put booking is 403` | `back/tests/Feature/SlotIntegrityTest.php:314` user `is_admin` false; `:321` `->assertForbidden()` | PASS |
| C26 | `Step3Confirm` shows `Horário já reservado.` and does not navigate to `/agendar/sucesso` | same Vitest invocation as the Gate, exit 0; printed `✓ src/pages/agendar/Step3Confirm.test.jsx > step3_shows_422_message_and_stays > step3_shows_422_message_and_stays` | `front/src/pages/agendar/Step3Confirm.test.jsx:52` `expect(await screen.findByRole("alert")).toHaveTextContent("Horário já reservado.")`; `:53` `expect(screen.queryByRole("heading", { name: "pagina sucesso" })).not.toBeInTheDocument()` | PASS |
| C27 | modal `Gerenciar Agendamento` stays open and shows `Horário já reservado.` | same Vitest run exit 0; printed `✓ … > admin_modal_stays_open_on_422` | `front/src/pages/admin/AdminDashboard.test.jsx:48` `expect(await screen.findByRole("alert")).toHaveTextContent("Horário já reservado.")`; `:49` `expect(screen.getByRole("heading", { name: "Gerenciar Agendamento" })).toBeInTheDocument()` | PASS |

## Level and sampling

Status-code and route claims use the HTTP boundary. C1–C12 and C14–C25 call `getJson`, `postJson`, or `putJson` in `SlotIntegrityTest`. C13's child posts `Request::create('/api/bookings', 'POST', …)` through the HTTP kernel at `back/tests/Support/post_booking.php:56` and the test asserts the returned status and message. C26 and C27 render `Step3Confirm` and `AdminDashboard` and assert the visible text and navigation; they are UI claims, not status-code claims.

C5 names three occupying statuses and the same run executed three data sets, `pendente`, `confirmado`, and `concluído`. No other check names more cases than the single case its proof runs. No level gap. No sampling gap.

## Swept existing

| Row | Cited constraint | Found |
| --- | --- | --- |
| authorization | `auth:sanctum` on `POST /bookings`, plus middleware `admin` on the admin `PUT` | `back/routes/api.php:19` opens `auth:sanctum`; `:23` is `POST /bookings`; `:28` opens `admin`; `:32` is `PUT /bookings/{booking}` |

Rows marked `n/a` (idempotency, data lifecycle, dependency failure, observability) are approved policy. The other swept rows point at checks C5, C7, C9, C10, C11, C12, C13, C17, C20, C23, C24, C25, C26, and C27, which passed above.

## Gate

`docker exec zenspa-api php artisan test --filter="test_cancelled_booking_time_is_listed|test_one_hundred_twenty_minutes_hides_09_and_10|test_one_hundred_twenty_minutes_keeps_11|test_past_grid_point_on_today_is_omitted|test_occupying_status_hides_grid_point|test_english_confirmed_status_does_not_occupy|test_slots_without_date_are_400|test_slots_for_missing_professional_are_404|test_overlapping_post_returns_reserved_message|test_overlapping_post_inserts_nothing|test_past_time_today_is_rejected|test_interval_outside_one_window_is_rejected|test_concurrent_overlapping_posts_persist_one|test_free_interval_returns_201|test_post_on_cancelled_time_returns_201|test_post_on_english_confirmed_returns_201|test_guest_post_booking_is_401|test_admin_reschedule_onto_occupant_keeps_previous_slot|test_admin_reschedule_outside_window_keeps_previous_slot|test_admin_status_only_update_returns_200_without_window|test_admin_put_own_interval_returns_200|test_admin_may_save_past_time_today|test_admin_time_must_match_hi|test_guest_put_admin_booking_is_401|test_non_admin_put_booking_is_403"` — 27 passed, 0 failed.

`npm test -- --reporter=verbose -t "step3_shows_422_message_and_stays|admin_modal_stays_open_on_422"` from `front/` — 2 passed, 0 failed. Both named tests printed as passed.
