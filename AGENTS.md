# AGENTS.md

Instructions for coding agents working in the ZenSpa repository.

## Project overview

ZenSpa is a spa management and booking system. The React SPA never renders on the server. The Laravel API serves JSON only from `/api/*`.

The repo is a monorepo:

- `back/` — Laravel 12 REST API (PHP 8.2+, MySQL 8)
- `front/` — React 19 SPA (JSX, Vite, Tailwind CSS 4, React Router 7)
- `docker-compose.dev.yml` and `docker-compose.prod.yml` — local and production containers

Authentication uses Laravel Sanctum Bearer tokens. The frontend stores the token in `localStorage` and sends `Authorization: Bearer`. Protected routes use `auth:sanctum`. Admin routes also pass `AdminMiddleware`, which requires `user.is_admin`.

Booking statuses are Portuguese strings: `pendente`, `confirmado`, `cancelado`, `concluído`. Keep the same values in API, database, and `front/src/constants/bookingStatuses.js`.

After `php artisan db:seed`, the local admin is `admin@zenspa.com` / `admin123`, with three professionals (Mon–Fri 09:00–18:00) and three services.

## Build and test

Run backend commands from `back/` and frontend commands from `front/`.

Backend:

```bash
composer install
composer test          # PHPUnit (CI uses this)
php artisan test       # same suite
php artisan pint       # format PHP
php artisan migrate
php artisan db:seed
```

PHPUnit uses an in-memory SQLite database (`back/phpunit.xml`). Run one class with `php artisan test --filter=TestClassName`.

Frontend:

```bash
npm install
npm run dev            # Vite on port 5173
npm run build
npm run lint           # ESLint; CI runs this
npm run typecheck
```

Docker, from the repository root:

```bash
docker-compose -f docker-compose.dev.yml up -d
docker exec -it zenspa-api php artisan migrate --seed
```

CI (`.github/workflows/ci.yml`) installs both apps, then runs `composer test` in `back/` and `npm run lint` in `front/`. A change is not done until the command that covers it passes.

## Architecture

**API.** Routes live in `back/routes/api.php`.

- Public: `POST /register`, `POST /login`, `GET /services`, `GET /professionals`, `GET /professionals/{id}/slots`
- Authenticated: `GET|PUT /user`, `POST /logout`, `GET|POST /bookings`, `GET /bookings/{booking}`, `POST /bookings/{booking}/cancel`
- Admin (`auth:sanctum` + `admin`): booking management, service and professional writes, professional availabilities, `GET /admin/financial/summary` and `/transactions`

**Models.**

- `User` has many `Booking`; `is_admin` gates admin routes
- `Service` — name, price, `duration_minutes`
- `Professional` has many `Booking` and `Availability`; `specialties` is JSON
- `Availability` — weekly window (`day_of_week`, `start_time`, `end_time`, `slot_duration`)
- `Booking` joins user, service, and professional
- `Transaction` records financial entries tied to bookings

Slot lists are computed in `ProfessionalController::availableSlots()` from availability minus existing bookings. Do not reimplement that rule in the client.

**Frontend.**

- `front/src/services/api.js` is the only HTTP client
- `AuthContext` holds identity, login, and logout
- `BookingContext` holds the four-step wizard
- Wizard: `/agendar` → `/agendar/profissional` → `/agendar/confirmacao` → `/agendar/sucesso`
- Other routes: `/`, `/login`, `/registrar`, `/admin`, `/meus-agendamentos`, `/meus-agendamentos/:id`
- Admin pages sit behind `PrivateRoute` and still depend on the API rejecting non-admins

## Conventions

- Do not stage `.env` files or secrets. Copy from `.env.example` locally.
- Do not weaken, skip, or delete tests to make a suite pass. Fix the code or add a failing test that states the bug.
- Every admin route must keep the `admin` middleware. A UI check is not a substitute for `is_admin` on the server.
- Match the surrounding file. PHP follows existing controllers, models, and feature tests. JSX follows existing components. Prefer Laravel conventions and the ESLint config already in `front/`.
- Schema changes go through migrations in `back/database/migrations`. Do not edit old migrations that have already shipped.
- Keep changes scoped to the request. Do not refactor unrelated code, add unused abstractions, or invent endpoints the UI does not call.
- New booking behavior needs a feature test under `back/tests/Feature/` that hits the HTTP layer, then a frontend change that uses `api.js` and the shared status constants.
