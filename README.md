# Finance Data Processing and Access Control Backend

A backend API for a finance dashboard system with role-based access control, financial record management, and summary-level analytics.

## Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **Database:** MongoDB (Atlas) via Mongoose
- **Auth:** JWT + bcrypt
- **Validation:** Zod

## Project Structure

```
src/
├── config/db.ts              # MongoDB connection
├── controllers/              # Route handler logic
├── middleware/               # Auth + error handling
├── models/                   # Mongoose schemas
├── routes/                   # Route definitions
├── utils/                    # JWT, response helpers, catchAsync
└── validators/               # Zod input schemas
```

## Setup

**1. Clone the repo and install dependencies**
```bash
git clone <repo-url>
cd zorvyn-finance-backend
npm install
```

**2. Create a `.env` file** (use `.env.example` as reference)
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/zorvyn_finance
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

**3. Start the development server**
```bash
npm run dev
```

The server runs on `http://localhost:5000`.

## Roles

| Role     | Dashboard | View Records | Create Records | Update/Delete Records | Manage Users |
|----------|-----------|--------------|----------------|-----------------------|--------------|
| viewer   | ✓         | ✗            | ✗              | ✗                     | ✗            |
| analyst  | ✓         | ✓            | ✗              | ✗                     | ✗            |
| admin    | ✓         | ✓            | ✓              | ✓                     | ✓            |

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint    | Access | Description              |
|--------|-------------|--------|--------------------------|
| POST   | `/register` | Public | Register a new user      |
| POST   | `/login`    | Public | Login and receive a JWT  |
| GET    | `/me`       | Any    | Get current user details |

### Users — `/api/users`

| Method | Endpoint | Access | Description                        |
|--------|----------|--------|------------------------------------|
| GET    | `/`      | Admin  | List all users                     |
| GET    | `/:id`   | Admin  | Get a single user                  |
| PATCH  | `/:id`   | Admin  | Update name, role, or status       |
| DELETE | `/:id`   | Admin  | Deactivate user (soft deactivation)|

### Financial Records — `/api/records`

| Method | Endpoint | Access          | Description                                |
|--------|----------|-----------------|--------------------------------------------|
| GET    | `/`      | Admin, Analyst  | List records with filtering + pagination   |
| GET    | `/:id`   | Admin, Analyst  | Get a single record                        |
| POST   | `/`      | Admin           | Create a new record                        |
| PATCH  | `/:id`   | Admin           | Update a record                            |
| DELETE | `/:id`   | Admin           | Soft delete a record                       |

**Filtering query params:** `type`, `category`, `from`, `to`, `page`, `limit`

### Dashboard — `/api/dashboard`

| Method | Endpoint        | Access | Description                              |
|--------|-----------------|--------|------------------------------------------|
| GET    | `/summary`      | Any    | Total income, expenses, net balance      |
| GET    | `/by-category`  | Any    | Totals grouped by category               |
| GET    | `/trends`       | Any    | Monthly income/expense for last N months |
| GET    | `/recent`       | Any    | Most recent N transactions               |

## Request / Response Format

All responses follow a consistent shape:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

Authentication is passed as a Bearer token:
```
Authorization: Bearer <token>
```

## Assumptions and Design Notes

- **Soft deletes:** Financial records are never permanently deleted. A `deletedAt` timestamp is set and the record is excluded from all queries. This preserves data for audit purposes.
- **Role default:** Newly registered users default to `viewer` unless a role is specified. In a production system, role assignment would be restricted to admins only.
- **Category is free text:** There is no fixed category list. The `type` field is restricted to `income` or `expense`; category can be anything (Salary, Rent, Freelance, etc.).
- **Password security:** Passwords are hashed with bcrypt (10 salt rounds) and the field is excluded from all database queries by default at the schema level.
- **No hard deletes on users:** Deleting a user deactivates them (`status: inactive`). Deactivated users cannot log in and their existing tokens are rejected.
