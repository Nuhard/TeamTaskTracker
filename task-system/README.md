# Daily Task Automation System

A centralized, automated web-based system for recording daily tasks, replacing manual spreadsheets. Built with Next.js, Prisma, and TailwindCSS.

## Features
- **User Authentication**: Secure Login/Register with JWT.
- **Task Management**: Create, Read, Update, Delete (CRUD) tasks.
- **Admin Dashboard**: View system stats (Total Users, Tasks, Completion status).
- **Responsive UI**: Built with TailwindCSS, supports Dark Mode.
- **Database**: SQLite (local) via Prisma ORM.

## Prerequisites
- Node.js 18+
- Docker (optional, for containerized deployment)

## Local Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Initialize Database**:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## Docker Deployment

1.  **Build and Run**:
    ```bash
    docker-compose up --build
    ```
    The app will be available at [http://localhost:3000](http://localhost:3000).

## API Endpoints
- `POST /api/auth/register`: Create user.
- `POST /api/auth/login`: Login user.
- `GET /api/tasks`: Get user's tasks.
- `POST /api/tasks`: Create task.
- `PUT /api/tasks/[id]`: Update task.
- `DELETE /api/tasks/[id]`: Delete task.
- `GET /api/admin/stats`: Get admin statistics.

## Environment Variables
Environment variables are set in `.env` (or `docker-compose.yml` for Docker).
- `DATABASE_URL="file:./dev.db"`
- `JWT_SECRET="your-secret-key"`
