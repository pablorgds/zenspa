# ZenSpa

ZenSpa is a modern spa management and booking application. It provides a seamless experience for users to book spa services and for staff to manage appointments.

## 🚀 Features

- **Service Booking**: Users can browse and book various spa services.
- **Professional Selection**: Choose preferred professionals for appointments.
- **Appointment Management**: Staff and admins can manage bookings and services.
- **REST API**: Powered by a robust Laravel-based API.
- **Modern UI**: A responsive frontend built with React and Vite.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [Laravel 12](https://laravel.com/)
- **Language**: PHP 8.2+
- **Database**: MySQL 8.0
- **Authentication**: Laravel Sanctum
- **Package Manager**: Composer

### Frontend
- **Library**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Routing**: React Router 7
- **Styling**: Tailwind CSS (assumed based on project structure)
- **Package Manager**: npm

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx

---

## 📋 Requirements

- **Docker** and **Docker Compose** (Recommended)
- **OR** locally installed:
    - PHP 8.2+
    - Composer
    - Node.js 20+ & npm
    - MySQL 8.0

---

## ⚙️ Setup & Installation

### Using Docker (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd zenspa
   ```

2. **Start the environment**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Initialize the Backend**:
   ```bash
   docker exec -it zenspa-api composer install
   docker exec -it zenspa-api php artisan key:generate
   docker exec -it zenspa-api php artisan migrate --seed
   ```

### Manual Installation

#### Backend
1. Navigate to the `back` directory: `cd back`
2. Install dependencies: `composer install`
3. Copy environment file: `cp .env.example .env`
4. Generate app key: `php artisan key:generate`
5. Configure your database in `.env` and run migrations: `php artisan migrate --seed`
6. Start the server: `php artisan serve`

#### Frontend
1. Navigate to the `front` directory: `cd front`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

---

## 🏃 Scripts

### Root
- Docker Dev: `docker-compose -f docker-compose.dev.yml up`
- Docker Prod: `docker-compose -f docker-compose.prod.yml up`

### Backend (`/back`)
- `php artisan serve`: Start local PHP server.
- `php artisan test`: Run backend tests.
- `php artisan migrate`: Run database migrations.
- `php artisan db:seed`: Seed database with initial data.

### Frontend (`/front`)
- `npm run dev`: Start Vite development server.
- `npm run build`: Build for production.
- `npm run lint`: Run ESLint.
- `npm run preview`: Preview production build locally.

---

## 🔐 Environment Variables

### Backend (`/back/.env`)
- `DB_CONNECTION`: Database driver (default: `mysql`).
- `DB_HOST`: Database host (default: `127.0.0.1` or `zenspa-db` for Docker).
- `APP_KEY`: Laravel application key.

### Frontend (`/front`)
- *TODO: Define VITE_API_URL or similar if environment-based configuration is added.*

---

## 🧪 Testing

### Backend
Run tests from the `back` directory:
```bash
php artisan test
```

### Frontend
*TODO: Add frontend testing framework (e.g., Vitest or Jest).*

---

## 📁 Project Structure

```text
zenspa/
├── back/               # Laravel API Application
│   ├── app/            # Business Logic (Models, Controllers)
│   ├── database/       # Migrations and Seeders
│   ├── routes/         # API Route definitions
│   └── tests/          # Backend Tests
├── front/              # React Frontend Application
│   ├── src/            # Source Code
│   │   ├── components/ # Reusable UI Components
│   │   ├── pages/      # Main Views
│   │   └── services/   # API Integration
│   └── public/         # Static Assets
├── docker-compose.dev.yml
└── docker-compose.prod.yml
```

---

## 📄 License

This project is licensed under the MIT License - see the [back/LICENSE](back/LICENSE) file for details (if available).
