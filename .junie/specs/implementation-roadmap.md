# ZenSpa — Spec de Implementação

**Data:** 2026-05-07  
**Status:** Em execução

## Estado Atual

### Implementado e Funcional
- Autenticação completa (register, login, logout, me, updateProfile) com Sanctum
- CRUD de Serviços (admin)
- CRUD de Profissionais (admin)
- Modelo `Availability` com cálculo de slots livres (`ProfessionalController::availableSlots`)
- Agendamentos do usuário (listar, ver, criar, cancelar)
- Agendamentos admin (listar com filtros, atualizar, cancelar, deletar)
- Índices de performance no banco
- Testes: AuthTest, BookingTest, ServiceTest, AdminTest, AdminBookingTest, ProfileTest
- Frontend: Landing page, wizard de agendamento 4 passos, MyBookingsPage, BookingDetailsPage, AdminDashboard (estrutura)
- AuthContext, BookingContext, api.js com todos os métodos mapeados

### Gaps Identificados
- Sem rotas admin para CRUD de `Availability` (admin não consegue alterar horários via interface)
- `payment_method` existe na tabela `bookings` mas sem lógica de pagamento
- Status `confirmado` não depende de pagamento
- Sem tabela `transactions` nem dashboard financeiro
- Sem envio de e-mail de confirmação
- Arquivos mockados em `front/src/data/` (services.js, professionals.js, plans.js, bookings.js, bookingsStorage.js) — podem estar substituídos pela API mas ainda existem
- Cancelamento do usuário sem regra de antecedência mínima

---

## Fases de Implementação

### Fase 1 — Estabilização

#### Item 1.1 — Limpeza de dados mockados no frontend ✅ Concluído em 2026-05-08
- **O que fazer:** Auditar cada arquivo em `front/src/data/` e `front/src/utils/bookingsStorage.js`; verificar se alguma página ainda os importa; remover ou substituir pelo uso de `api.js`
- **Critério de conclusão:** Nenhuma página importa dados de `src/data/`; todos os dados vêm da API
- **Testes:** Smoke test manual no wizard de agendamento e MyBookingsPage
- **O que foi feito:**
  - `QuickBooking.jsx`: substituído import de `SERVICES` mock por `api.getServices()` (useEffect); agora passa `serviceId` numérico e `price` reais no bookingData
  - `BookingConfirmStep.jsx`: removido `getServicePrice()` do mock; usa `bookingData.price` que vem da API
  - `Step3Confirm.jsx`: removida re-busca desnecessária de serviços para obter `service_id`; usa `bookingData.serviceId` diretamente
  - `PlansSection.jsx`: dados de planos (marketing estático) inline no componente; sem dependência de `data/`
  - Deletados: `data/services.js`, `data/professionals.js`, `data/bookings.js`, `data/plans.js`, `utils/bookingsStorage.js`

#### Item 1.2 — Gestão de Disponibilidades pelo Admin (backend + frontend) ✅ Concluído em 2026-05-08

**Backend:**
- Criar `AdminAvailabilityController` com métodos: `index`, `store`, `update`, `destroy`
- Registrar rotas em `api.php` sob `auth:sanctum` + `admin`:
  - `GET    /admin/professionals/{professional}/availabilities`
  - `POST   /admin/professionals/{professional}/availabilities`
  - `PUT    /admin/professionals/{professional}/availabilities/{availability}`
  - `DELETE /admin/professionals/{professional}/availabilities/{availability}`
- Validações: `day_of_week` (0–6), `start_time` < `end_time`, `slot_duration` > 0
- Adicionar métodos em `api.js`: `adminGetAvailabilities`, `adminCreateAvailability`, `adminUpdateAvailability`, `adminDeleteAvailability`

**Frontend:**
- Criar seção "Disponibilidades" no `AdminDashboard` (ou página separada `AdminAvailabilityPage`)
- UI: tabela por profissional + formulário de criação/edição
- Feedback visual de loading e erro

**Testes:** `AdminAvailabilityTest` com casos: unauthenticated → 401, non-admin → 403, admin CRUD → 200/201/204

---

### Fase 2 — Funcionalidades de Negócio

#### Item 2.1 — Módulo Financeiro Básico

**Backend:**
- Migration: tabela `transactions` (id, booking_id FK, amount, type `entrada|estorno`, description, created_at)
- Model `Transaction` com relação `belongsTo Booking`
- Atualizar `BookingController::store` para criar `Transaction` ao confirmar agendamento
- `AdminFinancialController` com:
  - `GET /admin/financial/summary?period=daily|monthly` — soma de receitas agrupada por período
  - `GET /admin/financial/transactions?page=1` — listagem paginada de transações

**Frontend:**
- Aba/seção "Financeiro" no `AdminDashboard`
- Cards de métricas: faturamento do dia, do mês, total de agendamentos
- Tabela de transações paginada

**Testes:** `AdminFinancialTest`

#### Item 2.2 — Regra de Antecedência no Cancelamento

**Backend:**
- Em `BookingController::cancel` e `AdminBookingController` (para usuário comum): rejeitar cancelamento se `booking.date + booking.time` estiver a menos de 24h do momento atual
- Retornar 422 com mensagem clara
- Variável configurável via `.env`: `BOOKING_CANCEL_HOURS_AHEAD=24`

**Testes:** Adicionar casos no `BookingTest`: cancelamento dentro do prazo → 422, fora do prazo → 200

#### Item 2.3 — Notificações por E-mail

**Backend:**
- Criar Mailable `BookingConfirmed` e `BookingCancelled`
- Disparar `BookingConfirmed` no `BookingController::store` após criação
- Disparar `BookingCancelled` em ambos os endpoints de cancelamento
- Usar Laravel Queue para não bloquear a resposta HTTP

**Configuração:** `.env` com `MAIL_MAILER`, `MAIL_HOST`, etc. (Mailtrap para dev)

**Testes:** Usar `Mail::fake()` para verificar disparo correto

---

### Fase 3 — Expansão

#### Item 3.1 — Integração de Pagamento (PIX simulado)

**Backend:**
- Endpoint `POST /bookings/{id}/pay` que simula pagamento:
  - Recebe `payment_method` (pix|cartao)
  - Para PIX: gera código alfanumérico aleatório + cria `Transaction`
  - Muda status do booking de `pendente` → `confirmado`
- Endpoint `GET /bookings/{id}/payment-status`

**Frontend:**
- Novo passo no wizard (ou modal no Step3Confirm): "Escolha o método de pagamento"
- Exibir QR code/código PIX ou formulário de cartão simulado
- Polling ou redirect para Step4Success após confirmação

#### Item 3.2 — Relatórios Exportáveis

**Backend:**
- `GET /admin/financial/export?format=csv&period=2026-05` — exporta transações em CSV/Excel
- Usar Laravel Excel ou geração manual de CSV

**Frontend:**
- Botão "Exportar CSV" na seção Financeiro do AdminDashboard

---

## Padrões Obrigatórios em Todas as Implementações

- **PHP:** PSR-12, métodos camelCase, colunas snake_case
- **Autenticação:** `auth:sanctum` em toda rota protegida; `admin` middleware em rotas admin
- **Validação:** `$request->validate()` com regras explícitas em cada endpoint
- **Frontend:** componentes funcionais, hooks (useState/useEffect), feedback de loading e erro em todas as operações assíncronas
- **Segurança:** nunca expor dados de outros usuários; sempre checar `user_id` ownership em rotas de usuário
- **Testes:** cada item da Fase 1 e 2 deve ter Feature Test antes de ir para o frontend
