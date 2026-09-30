# ZenSpa — Roadmap de implementação

**Revisão:** 2026-09-30  
**Status:** Núcleo utilizável; MVP da agenda ainda incompleto  
**Base:** este spec (2026-05-07), `AGENTS.md` e o código em `back/` e `front/`

## O que entra no MVP

O sistema existe para marcar procedimentos e operar a agenda de cada profissional. O MVP fecha quando a recepção e o cliente conseguem usar essa agenda sem horários fantasmas.

Pagamento e cobrança ficam fora do MVP. A possibilidade já está descrita na expansão (gateway, PIX, webhook, exportação). O campo `payment_method` de hoje é só a forma combinada de pagar no local (`pix`, `cartao_credito`, `cartao_debito`, `dinheiro`). O status `confirmado` continua sendo uma ação da recepção, não o resultado de uma cobrança.

## Já entregue

Não reimplementar estes itens. O spec de maio ainda listava o financeiro e a disponibilidade como pendentes; o código já os cobre.

| Capacidade | Onde está |
| --- | --- |
| Cadastro, login, logout, perfil (`GET/PUT /user`) com Sanctum | `AuthController`, `AuthTest`, `ProfileTest` |
| CRUD de serviços e profissionais (admin) | `ServiceController`, `ProfessionalController`, `AdminTest`, `ServiceTest` |
| Grade semanal do profissional e slots livres | `Availability`, `AdminAvailabilityController`, `ProfessionalController::availableSlots` |
| Cliente lista, vê, cria e cancela o próprio agendamento | `BookingController`, wizard em `/agendar`, `MyBookingsPage`, `BookingDetailsPage` |
| Admin lista com filtro, reagenda, muda status, cancela e apaga | `AdminBookingController`, aba de agendamentos no `AdminDashboard` |
| Disponibilidade editável pelo admin | rotas `/admin/professionals/{id}/availabilities`, aba no dashboard, `AdminAvailabilityTest` |
| Caixa interno: `transactions` + resumo diário/mensal + lista paginada | `AdminFinancialController`, aba Financeiro, `AdminFinancialTest` |
| Dados mockados removidos do frontend | `front/src/data/` e `bookingsStorage.js` apagados; telas usam `api.js` |
| Status canônicos | `pendente`, `confirmado`, `cancelado`, `concluído` em API, banco e `bookingStatuses.js` |

Limites do que já existe, para não tratar como pronto:

- O profissional é um cadastro, sem login. Quem opera a agenda é o admin (`is_admin`).
- O admin não cria agendamento para cliente de telefone ou balcão. Só o usuário logado marca para si.
- A grade é só semanal. Não há folga, feriado nem bloqueio de um intervalo.
- `availableSlots()` desconta qualquer horário gravado, inclusive `cancelado`. O `store` do cliente ignora cancelados, mas a lista de horários não.
- O conflito é igualdade de `time`. A duração do serviço (75 e 120 minutos no seed, slots de 60) não bloqueia o horário seguinte. Reagendar pelo admin não revalida grade nem conflito.
- Slots de hoje no passado continuam aparecendo.
- Não há trava contra duas marcações simultâneas no mesmo intervalo.
- Ao criar o agendamento (`pendente`) já nasce uma `Transaction` do tipo `entrada`. Cancelar não gera `estorno`. O resumo financeiro soma essas entradas.
- `PUT /user` não tem tela. Não há e-mail. Não há regra de antecedência no cancelamento.

## Ordem até o MVP

Cada item depende do anterior. Feature test em `back/tests/Feature/` antes da tela. Rotas admin continuam com `auth:sanctum` + `admin`.

### MVP-1 — Integridade dos horários

A agenda mente enquanto um horário cancelado, sobreposto ou passado puder ser marcado.

**Backend**

- `availableSlots` e a checagem do `BookingController::store` usam a mesma regra: ocupam o intervalo os status `pendente`, `confirmado` e `concluído`; `cancelado` libera.
- O intervalo ocupado é `time` + `service.duration_minutes`, não só o minuto inicial. Um serviço de 120 minutos às 09:00 bloqueia 10:00 e 11:00.
- Horário anterior a agora, no dia corrente, não entra na lista.
- `AdminBookingController::update` aplica a mesma regra ao mudar profissional, data ou hora. Recusar com 422 se cair fora da grade ou em cima de outro agendamento.
- Impedir a corrida: transação com lock, ou índice que não permita dois ativos no mesmo profissional e intervalo.

**Testes:** slot cancelado volta a aparecer; serviço mais longo que o slot recusa o horário sobreposto; admin não reagenda para horário ocupado; duas criações concorrentes no mesmo horário deixam um 201 e um 422.

### MVP-2 — Agenda do dia e marcação pela recepção ✅ Concluído em 2026-09-30

A aba atual é uma tabela filtrável. A operação do dia é outra tela.

**Backend**

- `GET /admin/agenda?date=YYYY-MM-DD&professional_id=` devolve, por profissional, os agendamentos do dia já ordenados e os encaixes livres.
- `POST /admin/bookings` cria agendamento para um usuário existente (busca por e-mail ou id), com a mesma validação do MVP-1. Status inicial `pendente` ou `confirmado`, escolhido pela recepção.
- Manter `PUT` para `confirmado` e `concluído`.

**Frontend**

- Visão do dia no admin: um profissional (ou todos) e a data, com os horários ocupados e a ação de encaixar, confirmar, concluir e cancelar.
- Formulário de encaixe para quem ligou ou chegou sem passar pelo wizard.

**Testes:** não-admin recebe 403; admin cria para outro usuário; horário inválido recebe 422; a agenda do dia não lista cancelados como ocupados.

### MVP-3 — Bloqueios pontuais

A grade semanal permanece o padrão. O que falta é a exceção.

**Backend**

- Tabela de bloqueios do profissional: dia inteiro ou intervalo (`starts_at`, `ends_at`), com motivo.
- CRUD admin em `/admin/professionals/{professional}/blocks`.
- Slots e criação de agendamento descontam esses intervalos. Bloqueio não apaga agendamento já marcado; a API recusa o bloqueio se o intervalo tiver agendamento ativo e devolve esses ids.

**Frontend:** na área de disponibilidades, lista e formulário de folga/bloqueio.

**Testes:** dia bloqueado não oferece slots; intervalo parcial esconde só os horários atingidos; bloqueio sobre agendamento ativo retorna 422.

### MVP-4 — Cancelamento com antecedência e caixa coerente

**Backend**

- `BookingController::cancel` recusa com 422 se faltar menos de `BOOKING_CANCEL_HOURS_AHEAD` horas (padrão 24) para `date` + `time`.
- O cancelamento admin não usa esse limite.
- Ao cancelar (cliente ou admin), se existir `entrada` desse booking e ainda não houver `estorno`, criar o `estorno` do mesmo valor. O resumo financeiro soma entradas e subtrai estornos. Não criar entrada nova em outro ponto do fluxo.

**Frontend:** a mensagem 422 aparece em `MyBookingsPage` e `BookingDetailsPage`. O `api.cancelBooking` precisa repassar o corpo do erro, hoje engolido por uma mensagem genérica.

**Testes:** dentro do prazo → 422; fora do prazo → 200 e `estorno` criado; segundo cancelamento não duplica estorno; admin cancela em cima da hora.

### MVP-5 — O profissional entra na própria agenda

Hoje só o admin vê a operação. O profissional precisa ver o próprio dia e encerrar o atendimento, sem virar admin e sem ver a agenda dos colegas.

**Backend**

- Ligar `professionals.user_id` a um usuário (único, opcional).
- Papel efetivo: admin vê tudo; profissional vê e atualiza só os próprios bookings.
- `GET /professional/agenda?date=` e `PATCH /professional/bookings/{booking}` limitado a `confirmado` → `concluído` e ao cancelamento do próprio horário.
- Profissional não altera preço, serviço, caixa nem a grade dos outros. Alterar a própria grade pode esperar; no MVP a grade continua com o admin.

**Frontend:** rota autenticada `/agenda` com a visão do dia do profissional logado. O admin continua em `/admin`.

**Testes:** profissional A não lê booking do profissional B (403); profissional marca `concluído` no próprio horário; usuário comum recebe 403; admin segue acessando o painel.

## Critério de MVP pronto

- Cliente marca só horário livre, respeitando duração e cancelamento.
- Recepção vê o dia de cada profissional, encaixa quem não usou o app, confirma, conclui e cancela.
- Folga e bloqueio saem da grade sem apagar histórico.
- Cancelamento do cliente respeita a antecedência; o caixa interno não conta agendamento cancelado como receita.
- Profissional autenticado vê só a própria agenda e conclui o próprio atendimento.
- Nenhum fluxo de PIX, cartão ou webhook foi acrescentado.

## Depois do MVP

Não iniciar enquanto os itens MVP-1 a MVP-5 estiverem abertos.

### Operação, ainda sem cobrança

- **E-mail.** `BookingConfirmed` e `BookingCancelled` em fila, com `Mail::fake()` nos testes. Disparar na criação e nos dois cancelamentos. Mailtrap em desenvolvimento.
- **Tela de perfil.** `PUT /user` já existe; falta a página para nome, e-mail e senha.
- **Procedimento × profissional.** `specialties` é texto livre. Quando a recepção precisar restringir quem executa cada serviço, trocar por relação explícita e filtrar o passo 2 do wizard.
- **Observação no agendamento.** Nota interna da recepção, invisível se o produto não quiser mostrá-la ao cliente.

### Pagamentos e cobrança

Continua o plano já escrito. Não antecipar.

- Cobrança de verdade (PIX e cartão, ou simulador só quando for a hora) em endpoint próprio. `confirmado` passa a depender da confirmação do pagamento apenas nesse momento, não antes.
- Webhook do provedor como fonte do status pago. Não confirmar no navegador.
- Estorno financeiro real alinhado ao provedor, no lugar do `estorno` interno do MVP-4.
- `GET /admin/financial/export?format=csv&period=YYYY-MM` e botão na aba Financeiro.

Até lá, a aba Financeiro permanece o caixa interno do MVP-4: valor previsto ou recebido no local, não liquidação de gateway.

## Fora de escopo

Avaliação editável pelo cliente, multiunidade, app nativo, testes de frontend e qualquer provedor de pagamento antes do bloco acima.

## Padrões

- PHP no estilo dos controllers atuais; validação explícita em cada endpoint.
- `auth:sanctum` nas rotas protegidas; `admin` nas rotas administrativas. Checagem de UI não substitui `is_admin`.
- Agendamento de cliente sempre confere `user_id`. Agenda de profissional sempre confere o vínculo com `professionals.user_id`.
- Status somente com os quatro valores de `Booking` e `front/src/constants/bookingStatuses.js`.
- Feature test no HTTP antes da tela correspondente. Não enfraquecer teste para ficar verde.
- Não versionar `.env`.
