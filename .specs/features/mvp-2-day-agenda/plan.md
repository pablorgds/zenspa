# MVP-2 — Agenda do dia e marcação pela recepção

## Problem

A recepção opera o dia numa tabela filtrável de todos os agendamentos. Quem atende o telefone ou o balcão não vê, numa data, a grade de cada profissional com ocupados e encaixes; e não consegue gravar horário para um cliente que já existe sem esse cliente abrir o wizard. O único `POST /bookings` grava `user_id` do token e status `pendente`. Quem ligou fica de fora, ou a recepção pede que a pessoa se cadastre e marque sozinha.

A evidência é o roadmap (revisão 2026-09-30): "A aba atual é uma tabela filtrável. A operação do dia é outra tela." e "O admin não cria agendamento para cliente de telefone ou balcão. Só o usuário logado marca para si." O spec de maio não traz métrica de conversão nem volume de suporte.

Com isto, a recepção vê o dia de um profissional ou de todos, encaixa quem não usou o app, e confirma, conclui ou cancela a partir dessa visão. O cliente continua marcando só para si pelo wizard.

## Flow

A ocupação, a grade e a trava de escrita são as de `SlotOccupancy` (exists, AD-001). Não nasce um segundo calculador de slot no admin nem no cliente.

1. `GET /admin/agenda` entra em módulo de agenda admin (new, no door - placement per conventions) — lê `date` e `professional_id` opcional; para cada `Professional` (exists) no recorte, monta `bookings` do dia ordenados por `time` e `free_slots` com a mesma omissão de ocupante e de ponto passado do dia corrente que `ProfessionalController::availableSlots` (exists) já usa via `SlotOccupancy` (exists).
2. `POST /admin/bookings` entra em `AdminBookingController` (exists) — resolve `User` (exists) por `user_id` ou `email`; roda `SlotOccupancy::run` (exists) com `isPast`, `fitsWindow` e `overlaps`; persiste `Booking` (exists) com `pendente` ou `confirmado` e `Transaction` tipo `entrada` (exists).
3. Confirmar, concluir e cancelar na visão do dia reutilizam `PUT /admin/bookings/{booking}` e `POST /admin/bookings/{booking}/cancel` em `AdminBookingController` (exists) — sem nova regra de ocupação quando o corpo muda só `status`.
4. out: aba Agenda em `AdminDashboard` (exists) lê o JSON do GET; o formulário de encaixe envia o POST; 422 mostra `{ message }` e permanece no formulário.

## Impact

| Front | What changes |
| --- | --- |
| domain | new term: agenda do dia — recorte por `date` (e opcionalmente um profissional) com ocupados e encaixes livres, lives in the admin agenda GET |
| domain | new term: encaixe — `POST /admin/bookings` que grava para um `User` já existente, com status inicial escolhido pela recepção |
| domain | existing term: `POST /bookings` continua sendo só o wizard do token; quem ramifica hoje: `BookingController::store`, `Step3Confirm` |
| stored data | nothing to migrate — mesma tabela `bookings`; cada encaixe novo ainda cria `entrada`, como o `POST` do cliente |

## Relations

None - no stored-data shape change

## Surface

| Route | In | Out | Status |
| --- | --- | --- | --- |
| `GET /admin/agenda` | query `date` (obrigatório), query `professional_id` (opcional) | `date` · `professionals[]` com `id`, `name`, `bookings[]` (mesmo JSON de `GET /admin/bookings`, ordenado por `time` crescente), `free_slots[]` (strings `H:i`) | `200`, `401`, `403`, `422` |
| `POST /admin/bookings` | `user_id` ou `email`, `service_id`, `professional_id`, `date`, `time`, `payment_method`, `status` (`pendente` ou `confirmado`) | JSON do booking com `service`, `professional`, `user` | `201`, `401`, `403`, `422` |

`GET /admin/bookings`, `PUT /admin/bookings/{booking}` e `POST /admin/bookings/{booking}/cancel` não mudam de assinatura.

## Landing

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| Contrato do GET da agenda | JSON `{ "date": "YYYY-MM-DD", "professionals": [ { "id", "name", "bookings": [Booking], "free_slots": ["H:i"] } ] }` | montar o dia no cliente com `GET /admin/bookings?date=` mais `GET /professionals/{id}/slots`: a lista pública é anônima, não agrupa por profissional num único 200, e o admin listaria `cancelado` no mesmo array que a recepção trata como ocupado |
| Contrato do POST da recepção | `POST /admin/bookings` no grupo `auth:sanctum` + `admin`; corpo com `user_id` ou `email` e `status` ∈ {`pendente`,`confirmado`} | reusar `POST /bookings` autenticado como admin: grava `user_id` do token e força `pendente`, então o encaixe para outro cliente e o `confirmado` no balcão não cabem |

- A trava `lockForUpdate` na linha do profissional já é AD-001; este item só a chama de novo no POST. Nada mais nesta mudança é difícil de reverter.

## Criteria

### S1: A recepção lê o dia (P1)

Um GET autenticado como admin devolve, por profissional, os agendamentos da data e os pontos da grade ainda livres.

**Acceptance Criteria**

1. WHEN `GET /admin/agenda?date=2026-10-05` é chamado por um admin THEN the system SHALL responder 200 com `date` igual a `2026-10-05` e `professionals` com um objeto por linha de `professionals`, cada um com `id`, `name`, `bookings` e `free_slots`.
2. WHEN a query também traz `professional_id` de um profissional existente THEN the system SHALL incluir em `professionals` exatamente esse `id`.
3. WHEN nesse profissional e data existe um booking `cancelado` às `09:00` e a grade emite `09:00` THEN the system SHALL incluir `09:00` em `free_slots` desse profissional.
4. WHILE o status de um booking daquela data é `pendente`, `confirmado` ou `concluído` the system SHALL omitir de `free_slots` todo ponto da grade que cai em `[time, time + duration_minutes)`.
5. WHEN os `bookings` de um profissional naquela data existem THEN the system SHALL devolvê-los ordenados por `time` crescente, inclusive os de status `cancelado`.
6. WHEN `date` é o dia corrente do relógio da aplicação e um ponto da grade é anterior a esse relógio THEN the system SHALL omitir esse ponto de `free_slots`.
7. IF a query omite `date` THEN the system SHALL responder 422.
8. IF um usuário autenticado sem `is_admin` chama `GET /admin/agenda?date=2026-10-05` THEN the system SHALL responder 403.
9. IF o pedido não traz token THEN `GET /admin/agenda` SHALL responder 401.

**Independent test:** `GET /api/admin/agenda?date=` com admin, com não-admin, sem token, com um `cancelado` às 09:00 e um ocupante de 120 minutos.

### S2: A recepção encaixa um cliente já cadastrado (P1)

O POST admin grava para outro usuário, com a ocupação do MVP-1, e aceita `pendente` ou `confirmado`.

**Acceptance Criteria**

10. WHEN um admin envia `POST /admin/bookings` com `user_id` de outro usuário, intervalo livre dentro da grade e `status` `pendente` THEN the system SHALL responder 201, persistir `user_id` desse usuário e `status` `pendente`, e inserir uma `Transaction` tipo `entrada` com `amount` igual a `price` do serviço.
11. WHEN o corpo traz `email` de um `User` existente e omite `user_id`, com o mesmo intervalo livre THEN the system SHALL responder 201 com `user_id` igual ao desse e-mail.
12. IF o corpo omite `user_id` e o `email` não existe em `users` THEN the system SHALL responder 422 com JSON `message` igual a `Usuário não encontrado.` e SHALL não inserir linha em `bookings`.
13. IF o intervalo cruza um ocupante do mesmo profissional na mesma data THEN `POST /admin/bookings` SHALL responder 422 com `message` igual a `Horário já reservado.` e SHALL não inserir linha em `bookings`.
14. IF `date` é o dia corrente e `time` é anterior ao relógio da aplicação THEN `POST /admin/bookings` SHALL responder 422 com `message` igual a `Horário já passou.`
15. IF `[time, time + duration_minutes)` não cabe inteiro em uma única janela de `Availability` THEN `POST /admin/bookings` SHALL responder 422 com `message` igual a `Horário fora da disponibilidade do profissional.`
16. WHEN o corpo traz `status` `confirmado` e o intervalo é livre THEN the system SHALL persistir `status` `confirmado` e ainda assim inserir a `entrada`.
17. IF `status` não é `pendente` nem `confirmado` THEN the system SHALL responder 422 e SHALL não inserir linha em `bookings`.
18. WHEN dois `POST /admin/bookings` disputam intervalos sobrepostos do mesmo profissional na mesma data THEN the system SHALL persistir exatamente um booking ocupante e SHALL responder 422 ao outro pedido.
19. IF um usuário autenticado sem `is_admin` chama `POST /admin/bookings` THEN the system SHALL responder 403 e SHALL não inserir linha em `bookings`.
20. IF o pedido não traz token THEN `POST /admin/bookings` SHALL responder 401.

**Independent test:** `POST /api/admin/bookings` com admin contra um `User` existente, um e-mail inexistente, um intervalo ocupado e um `status` fora do par permitido.

### S3: A aba Agenda opera o dia (P2)

No `/admin`, a recepção escolhe data e profissional (ou todos), vê ocupados e livres, encaixa, confirma, conclui e cancela.

**Acceptance Criteria**

21. WHEN a aba Agenda de `AdminDashboard` carrega com uma data THEN the system SHALL chamar `GET /admin/agenda` com essa `date` e SHALL mostrar, por profissional, cada `time` de `bookings` ocupantes e cada valor de `free_slots`.
22. WHEN `professionals` chega com `bookings` vazio e `free_slots` vazio THEN the system SHALL mostrar o texto `Nenhum horário neste dia.`
23. WHILE o GET da agenda não respondeu the system SHALL mostrar o texto `Carregando agenda...`
24. WHEN o GET da agenda falha THEN the system SHALL mostrar o texto `Não foi possível carregar a agenda.`
25. WHEN a recepção envia o formulário de encaixe THEN the system SHALL chamar `POST /admin/bookings` com `email` ou `user_id`, `service_id`, `professional_id`, `date`, `time`, `payment_method` e `status`.
26. WHEN esse POST responde 201 THEN the system SHALL fechar o formulário e SHALL voltar a chamar `GET /admin/agenda` para a data visível.
27. WHEN esse POST responde 422 THEN the system SHALL manter o formulário aberto e SHALL mostrar o `message` da resposta.
28. WHEN a recepção confirma um booking `pendente` na agenda do dia THEN the system SHALL chamar `PUT /admin/bookings/{id}` com `status` `confirmado`.
29. WHEN a recepção conclui um booking na agenda do dia THEN the system SHALL chamar `PUT /admin/bookings/{id}` com `status` `concluído`.
30. WHEN a recepção cancela na agenda do dia e confirma no `window.confirm` THEN the system SHALL chamar `POST /admin/bookings/{id}/cancel`.

**Independent test:** abrir `/admin`, aba Agenda, data com um ocupante e um `free_slots`; encaixe 201 e 422; confirmar, concluir e cancelar.

## Out of scope

| Excluded | Why |
| --- | --- |
| Criar `User` no balcão (telefone sem conta) | o roadmap restringe a usuário existente (e-mail ou id) |
| `GET /admin/users` ou autocomplete de clientes | o POST resolve e-mail ou id; listar a base de usuários é outra capacidade |
| Bloqueios pontuais (MVP-3) | a grade semanal continua o único calendário |
| Antecedência no cancelamento e `estorno` (MVP-4) | cancelar admin permanece só a mudança de status |
| Agenda autenticada do profissional (MVP-5) | sem `professionals.user_id`; o GET daqui é só `admin` |
| Remover a aba tabela Agendamentos | a operação do dia é outra superfície; o filtro histórico fica |
| E-mail, PIX, webhook, tela de perfil | o roadmap só abre isso com o MVP fechado |
| Reagendar (mudar `date`/`time`) a partir da agenda do dia | o modal da aba Agendamentos e o `PUT` já fazem isso |

## Assumptions

| Assumption | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Recorte de profissionais sem filtro | `professional_id` omitido devolve todos os profissionais, inclusive com `bookings` e `free_slots` vazios | o roadmap pede "um profissional (ou todos)" | n |
| `user_id` e `email` no mesmo corpo | resolve por `user_id` e ignora `email` | um identificador é suficiente; conflito entre os dois não é um caso da recepção | n |
| Comparação de e-mail | igualdade exata com `users.email` | a coluna já é única; não há normalização hoje no login | n |
| `payment_method` no encaixe | o mesmo `in` do `POST /bookings`: `cartao_credito`, `cartao_debito`, `pix`, `dinheiro` | o caixa interno já nasce daí | n |
| Ponto passado em `free_slots` | omitir no dia corrente, igual à lista pública | encaixe no passado seria recusado pelo POST (AC 14) | n |
| Onde vive a tela | nova aba `Agenda` em `AdminDashboard`, rota `/admin` inalterada | `PrivateRoute adminOnly` já cerca `/admin`; MVP-5 é que ganha `/agenda` | n |
| `professional_id` inexistente no GET | 422 da validação `exists:professionals,id` | alinhado ao restante do admin, não 404 solto | n |

**Open questions:** none - all resolved or logged above.

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| screen aba Agenda | empty state | AC 22 |
| screen aba Agenda | loading | AC 23 |
| screen aba Agenda | error state | AC 24 |
| screen aba Agenda | unauthorized | existing - `PrivateRoute` com `adminOnly` redireciona a `/`; a API ainda responde 403 (AC 8, AC 19) |
| screen aba Agenda | density and ordering | AC 5, AC 21 — por profissional, bookings por `time` crescente, livres ao lado |
| screen aba Agenda | destructive action confirms | AC 30 — `window.confirm` como na aba Agendamentos |
| screen formulário de encaixe | error state | AC 27 |
| screen formulário de encaixe | empty, loading | n/a - o submit só dispara depois do preenchimento; não há fetch de rascunho |
| API `GET /admin/agenda` | error shape and codes | AC 7, AC 8, AC 9 |
| API `GET /admin/agenda` | who may call | AC 8, AC 9 — `auth:sanctum` + `admin` |
| API `GET /admin/agenda` | response shape | AC 1, door 1 |
| API `POST /admin/bookings` | error shape and codes | AC 12, AC 13, AC 14, AC 15, AC 17 |
| API `POST /admin/bookings` | who may call | AC 19, AC 20 |
| API `POST /admin/bookings` | response shape | AC 10 — 201 com booking |
| all new `GET /admin/agenda`, `POST /admin/bookings` | versioning, rate limits | n/a - o prefixo `/api` não versiona; o grupo admin não ganha throttle novo |
| collection `professionals` no GET | grouping, naming, ordering, duplicates | AC 1, AC 2 — um objeto por profissional do recorte, chave `professionals`, ordem das linhas da tabela; sem duplicar o mesmo `id` |

## Sources

- `.specs/implementation-roadmap.md` seção MVP-2 — GET da agenda, POST da recepção, tela do dia, testes 403 / encaixe / 422 / cancelado não ocupa
- `AGENTS.md` — middleware `admin`, status canônicos, cliente HTTP só em `api.js`
- AD-001 em `.specs/STATE.md` — a escrita do encaixe reusa `lockForUpdate` na linha do profissional
