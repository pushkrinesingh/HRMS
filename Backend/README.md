# HRMS (Human Resource Management System) Backend

A robust and scalable Node.js and Express-based backend API for a Human Resource Management System (HRMS). Built using ES Modules and structured with clean separation of concerns, this system is designed to handle key HR workflows (including Employee Management, Attendance, Leave Requests, and Payroll) using a role-based access control model catering to Administrators, Managers, and Employees.

---

## Tech Stack

The backend uses the following technologies and dependencies as defined in [package.json](file:///home/pushkrine/FSL/BACKEND/HRMS/Backend/package.json):

* **Express (v5.2.1)**: A minimal and flexible web application framework for building routing and API controllers.
* **Mongoose (v9.9.1)**: MongoDB object modeling tool designed to work in an asynchronous environment for schema definitions and queries.
* **dotenv (v17.4.2)**: A zero-dependency module that loads environment variables from a `.env` file into `process.env`.
* **bcryptjs (v3.0.3)**: Used for hashing and securing user passwords.
* **jsonwebtoken (v9.0.3)**: Used for generating and verifying access/refresh JSON Web Tokens (JWT) for secure authentication.
* **cookie-parser (v1.4.7)**: Used for parsing cookie headers to extract JWT tokens stored in secure cookies.
* **cors (v2.8.6)**: Enabled Cross-Origin Resource Sharing with the frontend client.
* **swagger-ui-express (v5.0.1)**: Used to serve interactive API documentation.
* **nodemon (v3.1.14 - Dev Dependency)**: Tool that automatically restarts the node application when file changes in the directory are detected.

---

## Project Status & Progress

- [x] Express Application Initialization ([server.js](file:///home/pushkrine/FSL/BACKEND/HRMS/Backend/server.js))
- [x] Database Connection Configuration ([config/db.js](file:///home/pushkrine/FSL/BACKEND/HRMS/Backend/config/db.js))
- [x] Database Environment Variable Validation
- [x] API Health-Check Route (`GET /api/health`)
- [x] User & Authentication Module (Module 1)
- [x] Role-Based Access Control (RBAC) in `authMiddleware` (Module 1)
- [x] Employee Directory & Department Management (Module 2)
- [x] Interactive API documentation via Swagger UI
- [x] Profile Role Collections (Admin, Manager, Employee)
- [x] Administrative account seeding script
- [ ] Attendance & Leave Tracker (Module 3 - Planned)
- [ ] Payroll Management System (Module 4 - Planned)

---

## Folder Structure

The project follows a standard MVC-inspired directory structure for clean separation of concerns:

```text
Backend/
├── config/             # App configuration files (e.g. database setup)
│   ├── db.js           # Mongoose MongoDB connection config
│   └── swagger.js      # Swagger OpenAPI 3.0 specification
├── controllers/        # Request handlers & controller logic
│   ├── authController.js
│   ├── departmentController.js
│   └── employeeController.js
├── middleware/         # Custom Express middleware
│   └── authMiddleware.js
├── models/             # Mongoose schemas & data models
│   ├── Admin.js
│   ├── Department.js
│   ├── Employee.js
│   ├── Manager.js
│   └── User.js
├── routes/             # Express API route definitions
│   ├── authRoutes.js
│   ├── departmentRoutes.js
│   └── employeeRoutes.js
├── scripts/            # Database utility scripts
│   └── seedAdmin.js    # Initial Admin account creation script
├── .env                # Local environment variables (git-ignored)
├── .env.example        # Example environmental configuration template
├── .gitignore          # Config for Git to ignore dependency & secret files
├── package.json        # Project metadata, scripts, and dependencies
└── server.js           # Core entry point of the Express server
```

---

## Setup & Installation Instructions

Follow these steps to set up and run the project locally:

### 1. Prerequisite
Ensure you have [Node.js](https://nodejs.org) (v18+ recommended) and a running [MongoDB](https://www.mongodb.com) cluster or local database instance.

### 2. Clone and Navigate
Navigate into the backend project root folder:
```bash
cd Backend
```

### 3. Install Dependencies
Install all package dependencies:
```bash
npm install
```

### 4. Configure Environment Variables
Create a local `.env` file in the root of the `Backend/` directory. You can base it on [.env.example](file:///home/pushkrine/FSL/BACKEND/HRMS/Backend/.env.example):
```env
PORT=5000
MONGO_URL=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@hrms.com
ADMIN_PASSWORD=admin123
```

### 5. Seeding the Initial Admin User
Since the registration and employee provisioning endpoints are restricted to Admin accounts, you must seed the initial Admin user before making request calls:
```bash
npm run seed:admin
```

### 6. Running the Application
* **Development Mode** (with automatic hot-reloading via nodemon):
  ```bash
  npm run dev
  ```
* **Production Mode**:
  ```bash
  npm start
  ```

Once running, you can access the interactive API docs at:
`http://localhost:5000/api-docs/`

---

## API Documentation

| Method | Endpoint | Auth Required | Role Access | Description | Expected Request Body |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | No | Public | Returns the health and database status of the server. | None |
| `POST` | `/api/auth/register` | Yes (Access Cookie) | `admin` | Registers a new user account and dynamic profile record. | `{ "name": "...", "email": "...", "password": "...", "role": "..." }` (and optional profile fields) |
| `POST` | `/api/auth/login` | No | Public | Authenticates credentials. Sets `accessToken` and `refreshToken` cookies. | `{ "email": "...", "password": "..." }` |
| `POST` | `/api/auth/refresh` | No | Public | Refreshes and returns/sets a new `accessToken` cookie. | None (reads refresh token from cookie) |
| `POST` | `/api/auth/logout` | No | Public | Clears `accessToken` and `refreshToken` cookies from browser. | None |
| `GET` | `/api/auth/me` | Yes (Access Cookie) | Any Role | Retrieves details of the logged-in user profile (no password). | None |
| `POST` | `/api/departments` | Yes (Access Cookie) | `admin` | Creates a new department. | `{ "name": "..." }` |
| `GET` | `/api/departments` | Yes (Access Cookie) | Any Role | Retrieves a list of all departments. | None |
| `POST` | `/api/employees` | Yes (Access Cookie) | `admin` | Provisions a new Admin, Manager, or Employee user and profile dynamically. | `{ "name": "...", "email": "...", "password": "...", "role": "..." }` |
| `GET` | `/api/employees` | Yes (Access Cookie) | `admin`, `manager` | Retrieves all employees (fully populated with User/Dept details). | None |
| `GET` | `/api/employees/stats/department-count` | Yes (Access Cookie) | `admin` | Aggregates and returns employee headcount grouped by department. | None |
| `GET` | `/api/employees/:id` | Yes (Access Cookie) | `admin`, `manager` | Retrieves a single employee's details by ID. | None |
| `PUT` | `/api/employees/:id` | Yes (Access Cookie) | `admin` | Updates employee details. | `{ "designation": "...", "salary": { "basic": 0, "hra": 0 } }` (partial) |
| `DELETE` | `/api/employees/:id` | Yes (Access Cookie) | `admin` | Deletes an employee record. | None |

---

## Authentication & Authorization Flow

1. **Tokens**:
   * **Access Token**: Short-lived JWT (`15m` expiry) stored in a secure `httpOnly` cookie (`accessToken`), containing user ID and role for RBAC.
   * **Refresh Token**: Long-lived JWT (`7d` expiry) stored in a secure `httpOnly` cookie (`refreshToken`), containing user ID.
2. **Access Control**:
   * The `authMiddleware` extracts and validates the `accessToken` from cookies, populating `req.user`. It also checks if the user's role satisfies any configured route constraints directly, returning `403 Forbidden` if unauthorized.
3. **Token Rotation / Refresh**:
   * When the access token expires, the client calls `/api/auth/refresh` to automatically read the refresh cookie and issue a new access token.

---

## User Roles & Permissions

The system implements role-based routing constraints across three main roles:

| Role | Permissions Overview | Status |
| :--- | :--- | :--- |
| **Admin** | Full system access. Create departments, register/provision users, update/delete profiles, view department count aggregation stats. | *Implemented* |
| **Manager** | View all employee records and individual employee records. Access to read-only listings. | *Implemented* |
| **Employee** | Access to own profile data (`/me`). No manager or admin features. | *Implemented* |
