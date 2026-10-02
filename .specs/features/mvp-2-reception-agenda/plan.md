# MVP-2 — Agenda do dia e marcação pela recepção

## Problem

A recepção opera o dia numa tabela de todos os agendamentos, com filtro. Quem ligou ou chegou ao balcão não tem como ser encaixado: só o próprio usuário logado grava `POST /bookings` para si. Confirmar, concluir e cancelar existem no modal da tabela, mas a recepção não vê a grade do dia com os encaixes livres ao lado dos ocupados.

O roadmap (revisão 2026-09-30) não traz volume de suporte nem data de corte; o custo descrito é operacional: "A aba atual é uma tabela filtrável. A operação do dia é outra tela." e "O admin não cria agendamento para cliente de telefone ou balcão."

Com isto, a recepção escolhe data e profissional, vê o dia ordenado, encaixa um usuário já cadastrado e segue confirmando, concluindo e cancelando no mesmo lugar.

## Flow

Reuses `SlotOccupancy` (exists) and the lock in AD-001; the day view does not compute occupancy in the client. Confirm, complete and cancel stay on the existing `PUT` and `POST .../cancel`.

1. `GET /admin/agenda` entra em `AdminBookingController` (exists) — `date` obrigatório, `professional_id` opcional — monta um bloco por profissional com bookings da data ordenados por `time` e `free_slots` pela mesma regra de `ProfessionalController::availableSlots` (exists).
2. `POST /admin/bookings` entra em `AdminBookingController` (exists) — resolve o cliente por `user_id` ou `email` já existente, corre `SlotOccupancy::run` (exists, AD-001) e persiste `Booking` (exists) mais `Transaction` tipo `entrada` (exists).
3. Confirmar, concluir e cancelar na visão do dia chamam `PUT /admin/bookings/{booking}` e `POST /admin/bookings/{booking}/cancel` (exists) — sem nova regra de ocupação neste item.
4. out: JSON 200/201/422; a aba Agenda em `AdminDashboard` (exists) lê o envelope e o formulário de encaixe mostra o `message` do 422.

## Impact

| Front | What changes |
| --- | --- |
| domain | new term: agenda do dia — envelope de uma `date` com, por profissional, os bookings daquela data e os `free_slots` ainda encaixáveis. Vive na resposta de `GET /admin/agenda` e na aba Agenda. |
| domain | existing term: `confirmado` continua ação da recepção, não resultado de cobrança. Quem ramifica hoje: `AdminBookingController::update`, o modal da aba Agendamentos, `bookingStatuses.js`. O `POST /admin/bookings` passa a aceitar `pendente` ou `confirmado` na criação. |
| stored data | nada a migrar. Cada encaixe é um `Booking` novo e a mesma `entrada` que o `POST /bookings` do cliente já grava. A aba Agendamentos (tabela filtrável) permanece. |

## Relations

None - no stored-data shape change

`Booking` continua pertencendo a um `User` existente. Este item não cria entidade, unicidade nova nem enum novo.

## Surface

| Route | In | Out | Status |
| --- | --- | --- | --- |
| `GET /admin/agenda` | query `date` (`YYYY-MM-DD`); query `professional_id` opcional | `{ date, professionals: [{ id, name, bookings, free_slots }] }` · `{ message }` | `200`, `401`, `403`, `422` |
| `POST /admin/bookings` | `user_id` ou `email`; `service_id`; `professional_id`; `date`; `time`; `payment_method`; `status` opcional (`pendente` ou `confirmado`) | booking com `user`, `service`, `professional` · `{ message }` | `201`, `401`, `403`, `422` |

`PUT /admin/bookings/{booking}` e `POST /admin/bookings/{booking}/cancel` não mudam de assinatura.

## Landing

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| Envelope da agenda do dia | JSON `{ date, professionals: [{ id, name, bookings, free_slots }] }`; `free_slots` é array de strings `H:i` na mesma regra de `GET /professionals/{id}/slots`; `bookings` inclui todo status daquela data, ordenado por `time` asc | estender `GET /admin/bookings` com slots livres: a lista filtrável já é um array plano de bookings e misturar `free_slots` quebra o contrato da tabela |
| Encaixe só de usuário existente | `POST /admin/bookings` resolve `user_id` ou `users.email`; não insere `User` | criar conta no balcão sem senha: o roadmap pede usuário existente; conta órfã vira lixo no login do cliente |
| Trava na criação admin | o `POST /admin/bookings` entra em `SlotOccupancy::run` (AD-001) antes de checar e inserir | índice único `(professional_id, date, time)` — já rejeitado no MVP-1: não reabre `cancelado` nem cruza `duration_minutes` |

- Nada mais nesta mudança é difícil de reverter. A aba Agenda no dashboard é colocação.

## Criteria

### S1: A recepção lê o dia (P1)

Um admin autenticado pede a grade de uma data e recebe ocupados e encaixes, sem tratar `cancelado` como ocupado.

**Acceptance Criteria**

1. WHEN `GET /admin/agenda?date=` recebe `date` válido THEN o sistema SHALL responder 200 com `date` igual à query e `professionals` como array.
2. WHEN a query não traz `professional_id` THEN o sistema SHALL incluir um objeto em `professionals` para cada profissional persistido, com `id` e `name`.
3. WHEN a query traz `professional_id` de um profissional existente THEN o sistema SHALL responder 200 com `professionals` de comprimento 1 e `id` igual a esse valor.
4. WHEN existem bookings daquela `date` naquele profissional THEN o sistema SHALL devolver esses bookings em `bookings` ordenados por `time` ascendente, cada um com `user` e `service`.
5. WHEN um booking daquela data tem status `cancelado` THEN o sistema SHALL incluí-lo em `bookings` e SHALL incluir o `time` dele em `free_slots` se a grade ainda emitir esse ponto e o relógio não o omitir.
6. WHEN um booking ocupante (`pendente`, `confirmado` ou `concluído`) cobre um ponto da grade THEN o sistema SHALL omitir esse ponto de `free_slots`.
7. WHEN `date` é o dia corrente do relógio da aplicação e um ponto da grade é anterior a esse relógio THEN o sistema SHALL omitir esse ponto de `free_slots`.
8. IF a query omite `date` ou `date` não é uma data THEN o sistema SHALL responder 422 e SHALL não devolver `professionals`.
9. IF `professional_id` não existe em `professionals` THEN o sistema SHALL responder 422.

**Independent test:** `GET /api/admin/agenda?date=` autenticado como admin, com um cancelado, um ocupante e um horário de hoje já passado.

### S2: A recepção encaixa um cliente existente (P1)

O `POST /admin/bookings` grava para outro usuário com a ocupação do MVP-1 e o status que a recepção escolheu.

**Acceptance Criteria**

10. WHEN o corpo traz `user_id` de um usuário existente, intervalo livre e `status` `confirmado` THEN `POST /admin/bookings` SHALL responder 201 com `user_id` desse cliente (não o do admin), `status` `confirmado`, e SHALL persistir `Transaction` tipo `entrada` com `amount` igual ao `price` do booking.
11. WHEN o corpo omite `status` e o intervalo é válido THEN o sistema SHALL persistir `status` `pendente` e SHALL responder 201.
12. WHEN o corpo traz `email` de um usuário existente e omite `user_id` THEN o sistema SHALL persistir `user_id` desse usuário e SHALL responder 201.
13. IF nenhum usuário tem aquele `email` THEN o sistema SHALL responder 422 com JSON `message` igual a `Cliente não encontrado.` e SHALL não inserir linha em `bookings`.
14. IF o corpo omite `user_id` e omite `email` THEN o sistema SHALL responder 422 e SHALL não inserir linha em `bookings`.
15. IF o intervalo cruza um booking ocupante THEN o sistema SHALL responder 422 com JSON `message` igual a `Horário já reservado.` e SHALL não inserir linha em `bookings`.
16. IF `date` é a data corrente e `time` é anterior ao relógio da aplicação THEN o sistema SHALL responder 422 com JSON `message` igual a `Horário já passou.`
17. IF `[time, time + duration_minutes)` não cabe inteiro em uma janela de `Availability` daquele profissional naquele dia da semana THEN o sistema SHALL responder 422 com JSON `message` igual a `Horário fora da disponibilidade do profissional.`
18. IF `status` no corpo não é `pendente` nem `confirmado` THEN o sistema SHALL responder 422 e SHALL não inserir linha em `bookings`.
19. WHEN dois `POST /admin/bookings` disputam intervalos sobrepostos do mesmo profissional na mesma data THEN o sistema SHALL persistir exatamente um booking ocupante e SHALL responder 422 ao outro pedido.

**Independent test:** `POST /api/admin/bookings` como admin, cliente por `email` e por `user_id`, overlap 120 minutos, e-mail inexistente.

### S3: Só admin chama a agenda e o encaixe (P1)

As duas rotas novas ficam atrás de `auth:sanctum` e `admin`.

**Acceptance Criteria**

20. IF o pedido a `GET /admin/agenda` ou a `POST /admin/bookings` não traz autenticação THEN o sistema SHALL responder 401.
21. IF o usuário autenticado tem `is_admin` falso THEN o sistema SHALL responder 403 com JSON `message` igual a `Unauthorized. Admin access required.`

**Independent test:** as duas rotas sem token e com um usuário comum.

### S4: Visão do dia no admin (P1)

A aba Agenda mostra um dia, um profissional ou todos, ocupados e encaixes, e as ações de confirmar, concluir e cancelar.

**Acceptance Criteria**

22. WHEN a recepção abre a aba Agenda THEN o sistema SHALL pedir `GET /admin/agenda` com `date` igual ao valor do seletor (padrão: data corrente do navegador) e SHALL renderizar, por profissional devolvido, cada item de `bookings` e cada string de `free_slots`.
23. WHEN `professionals` chega com `bookings` vazio e `free_slots` vazio em todos os blocos THEN a aba Agenda SHALL mostrar o texto `Nenhum horário neste dia.`
24. WHILE o `GET /admin/agenda` não respondeu THEN a aba Agenda SHALL mostrar o texto `Carregando agenda...`
25. IF o `GET /admin/agenda` falha THEN a aba Agenda SHALL mostrar o `message` do JSON quando existir, senão o texto `Não foi possível carregar a agenda.`
26. WHEN a recepção confirma um booking `pendente` na aba Agenda THEN o sistema SHALL chamar `PUT /admin/bookings/{id}` com `status` `confirmado` e SHALL atualizar o status visível para `confirmado` após 200.
27. WHEN a recepção conclui um booking na aba Agenda THEN o sistema SHALL chamar `PUT /admin/bookings/{id}` com `status` `concluído` e SHALL atualizar o status visível para `concluído` após 200.
28. WHEN a recepção cancela um booking na aba Agenda e confirma o `window.confirm` THEN o sistema SHALL chamar `POST /admin/bookings/{id}/cancel` e SHALL mostrar esse booking como `cancelado` após 200.
29. WHILE a aba Agendamentos (tabela filtrável) permanece THEN o sistema SHALL continuar listando via `GET /admin/bookings`.

**Independent test:** login `admin@zenspa.com`, aba Agenda, um dia com ocupado e furo, confirmar e cancelar.

### S5: Formulário de encaixe (P1)

Quem ligou ou chegou é gravado sem passar pelo wizard, contra um usuário já cadastrado.

**Acceptance Criteria**

30. WHEN a recepção aciona encaixe num `free_slot` THEN o formulário SHALL ir pré-preenchido com o `professional_id` daquele bloco, a `date` do seletor e o `time` daquele slot, e SHALL pedir `email`, `service_id`, `payment_method` e `status` (`pendente` ou `confirmado`).
31. WHEN o `POST /admin/bookings` do formulário responde 201 THEN o formulário SHALL fechar e a aba Agenda SHALL voltar a pedir `GET /admin/agenda` de modo que o novo `time` não esteja em `free_slots`.
32. IF o `POST /admin/bookings` do formulário responde 422 THEN o formulário SHALL permanecer aberto e SHALL mostrar o `message` dessa resposta.

**Independent test:** encaixar `email` de um usuário seed num furo visível; repetir com e-mail inexistente e ler `Cliente não encontrado.`

## Out of scope

| Excluded | Why |
| --- | --- |
| Criar usuário no balcão | o roadmap limita a usuário existente; senha e e-mail de boas-vindas são outro produto |
| Busca paginada de clientes (`GET /admin/users`) | o encaixe resolve `user_id` ou `email` no próprio POST |
| Bloqueios pontuais (MVP-3) | a grade semanal continua o único calendário |
| Antecedência no cancelamento e estorno (MVP-4) | cancelar admin neste item não mexe no caixa além da `entrada` da criação |
| Agenda do profissional autenticado (MVP-5) | sem `professionals.user_id`; o envelope da door 1 é o que esse item pode copiar depois |
| E-mail, PIX, webhook, tela de perfil | o roadmap só abre isso com o MVP fechado |
| Apagar a aba Agendamentos | a tabela filtrável continua a lista administrativa |

## Assumptions

| Assumption | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Onde mora a visão do dia | nova aba `Agenda` em `AdminDashboard` na rota `/admin`, sem `/admin/agenda` na SPA | o admin já é uma SPA de uma rota e `PrivateRoute adminOnly` já cobre `/admin` | n |
| `user_id` e `email` juntos | `user_id` vence; `email` é ignorado | um id válido não precisa de segunda resolução | n |
| `status` omitido no POST | `pendente` | igual ao `POST /bookings` do cliente; a recepção opta por `confirmado` quando quiser | n |
| `payment_method` no encaixe | obrigatório, mesmo conjunto `pix`, `cartao_credito`, `cartao_debito`, `dinheiro` | o `POST /bookings` do cliente já exige; a `entrada` precisa do contexto de pagamento no local | n |
| Profissional sem janela naquele dia da semana | entra em `professionals` com `bookings` e `free_slots` vazios | omitir o bloco esconde que a recepção filtrou “todos” | n |
| Relógio dos `free_slots` | o mesmo `config('app.timezone')` do MVP-1 | a lista pública e a agenda do dia não podem discordar do “agora” | n |

**Open questions:** none - all resolved or logged above.

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| screen aba Agenda | empty state | AC 23 |
| screen aba Agenda | loading | AC 24 |
| screen aba Agenda | error state | AC 25 |
| screen aba Agenda | unauthorised | existing - `PrivateRoute adminOnly` redireciona para `/` |
| screen aba Agenda | density and ordering | AC 4, AC 22 — bookings por `time` asc; um bloco por profissional da resposta |
| screen aba Agenda | destructive action confirms | AC 28 — `window.confirm` no cancelar, igual à aba Agendamentos; confirmar e concluir sem diálogo extra |
| screen formulário de encaixe | empty state | n/a - o formulário abre a partir de um `free_slot` já escolhido |
| screen formulário de encaixe | loading | n/a - o submit usa o mesmo padrão de botão das outras actions do dashboard, sem tela dedicada de loading |
| screen formulário de encaixe | error state | AC 32 |
| screen formulário de encaixe | unauthorised | existing - a aba já está atrás de `PrivateRoute adminOnly` |
| API `GET /admin/agenda` | response shape | AC 1 |
| API `GET /admin/agenda` | error shape and codes | AC 8, AC 9, AC 20, AC 21 |
| API `GET /admin/agenda` | who may call | AC 20, AC 21 |
| API `GET /admin/agenda` | versioning, rate limits | n/a - `/api` sem versão; throttle extra só existe em login/register |
| API `POST /admin/bookings` | response shape | AC 10 |
| API `POST /admin/bookings` | error shape and codes | AC 13, AC 15, AC 16, AC 17, AC 18, AC 20, AC 21 |
| API `POST /admin/bookings` | who may call | AC 20, AC 21 |
| API `POST /admin/bookings` | versioning, rate limits | n/a - `/api` sem versão; throttle extra só existe em login/register |

## Sources

- `.specs/implementation-roadmap.md` seção MVP-2 — `GET /admin/agenda`, `POST /admin/bookings`, visão do dia e formulário de encaixe
- AD-001 em `.specs/STATE.md` — a criação admin reutiliza `lockForUpdate` na linha do profissional
- `AGENTS.md` — rotas admin com `auth:sanctum` + `admin`; status canônicos
