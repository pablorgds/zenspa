# Project Guidelines: ZenSpa

Welcome to the ZenSpa project. This document provides an overview of the project structure, technical stack, and guidelines for development.

## Project Overview
ZenSpa is a spa management and booking application. It features a React-based frontend for users and staff, and a Laravel-based REST API for data management and business logic.

## Project Structure
The repository is organized as a monorepo with the following main directories:

- `/back`: The backend application, built with **Laravel**.
    - `app/Http/Controllers/Api`: API endpoints.
    - `app/Models`: Eloquent models (Booking, Professional, etc.).
    - `database/migrations`: Database schema definitions.
    - `tests/`: Feature and Unit tests.
- `/front`: The frontend application, built with **React** and **Vite**.
    - `src/components`: Reusable UI components.
    - `src/pages`: Main application views.
    - `src/services`: API service integration.
- `/docker-compose.dev.yml`: Configuration for the development environment.
- `/docker-compose.prod.yml`: Configuration for the production environment.

## Technical Stack
- **Backend**: Laravel (PHP), MySQL.
- **Frontend**: React, Vite, Tailwind CSS (likely, based on `styles` directory).
- **Infrastucture**: Docker, Nginx.

## Development Guidelines
- **Coding Style**: Follow PSR-12 for PHP and standard ESLint rules for React.
- **Database**: Use migrations for any schema changes. Seeders are available in `back/database/seeders`.
- **API**: The frontend communicates with the backend via the API services defined in `front/src/services/api.js`.
- **Testing**:
    - Backend: Run tests using `docker exec zenspa-api php artisan test` (or inside the container with `php artisan test`).
    - Backend Coverage: Tests cover Authentication, Admin access, Slot calculation, and Booking creation.
    - Frontend: Check `package.json` for available test scripts (no specific framework set up yet).
- **Skills**:
    - **Test Generator**: Use the skill defined in `.junie/skills/test-generator.md` to create new functional tests.
    - **Feature Implementer**: Use `.junie/skills/feature-implementer.md` for implementing new features (backend + tests + frontend in sequence).
    - **Roadmap Executor**: Use `.junie/skills/roadmap-executor.md` to implement items from the prioritized spec. Always follow phase order (1 → 2 → 3).
- **Spec**: The implementation roadmap lives in `.junie/specs/implementation-roadmap.md`. Update item status there (`✅ Concluído`) after completing each item.
- **Tests**: Junie and other developers should run relevant tests when modifying core logic to prevent regressions.

## Plano de Expansão e Módulos Avançados (Roadmap)

O projeto ZenSpa deve evoluir com as seguintes funcionalidades avançadas:

### 1. Gestão Avançada de Agendamentos (Admin)
- **Controle de Status**: Adicionar `status` (pendente, confirmado, cancelado, concluído) à tabela `bookings`.
- **Modificações**: Interface para o administrador reagendar (trocar data/hora/profissional) ou cancelar qualquer reserva.
- **Filtros**: Visualização de agendamentos por profissional, dia e status no `AdminDashboard`.

### 2. Módulo de Pagamentos e Integrações
- **Integração com Cartão**: Implementar fluxo de processamento de cartão (ex: Stripe ou simulador via Sanctum).
- **Geração de PIX**: Implementar endpoint para gerar código PIX e QR Code para pagamento instantâneo.
- **Workflow de Confirmação**: O agendamento só deve ser marcado como 'confirmado' após a notificação de pagamento (Webhook).

### 3. Módulo Financeiro
- **Transações**: Tabela `transactions` para registrar cada entrada financeira vinculada ao `booking_id`.
- **Dashboard Financeiro**: Interface admin para visualizar faturamento diário, mensal e por tipo de serviço/profissional.
- **Relatórios**: Exportação simples de dados financeiros para controle de caixa.

### 4. Estabilização e UX Avançada
- **Notificações**: Alertas de confirmação de agendamento por e-mail ou no dashboard do usuário.
- **Recuperação**: Opção para o usuário cancelar seu próprio agendamento respeitando regras de antecedência.

## Building and Running
The project is designed to be run with Docker.
- Development: `docker-compose -f docker-compose.dev.yml up`
