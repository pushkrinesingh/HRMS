# HRMS (Human Resource Management System) Backend

A robust and scalable Node.js and Express-based backend API for a Human Resource Management System (HRMS). Built using ES Modules and structured with clean separation of concerns, this system handles key HR workflows (including Employee Directory, Team View, and Role-Based Access Control) catering to Administrators, Managers, and Employees.

---

## Tech Stack

The backend uses the following technologies and dependencies as defined in [package.json](./package.json):

* **Express (v5.2.1)**: A minimal and flexible web application framework for building routing and API controllers.
* **Mongoose (v9.9.1)**: MongoDB object modeling tool for schema definitions, validation, transactions, and queries.
* **dotenv (v17.4.2)**: Environment variable management for `.env` files.
* **bcryptjs (v3.0.3)**: Secure password hashing.
* **jsonwebtoken (v9.0.3)**: Access and Refresh JSON Web Tokens (JWT) for secure authentication.
* **cookie-parser (v1.4.7)**: Cookie parsing header middleware for extracting HTTP-Only JWT cookies.
* **cors (v2.8.6)**: Cross-Origin Resource Sharing middleware for frontend integration.
* **swagger-ui-express (v5.0.1)**: Interactive API documentation UI.
* **nodemon (v3.1.14 - Dev Dependency)**: Development tool for automatic server restarts on code changes.

---

## Key Architectural Highlights & Recent Enhancements

* **Unified `GET /api/employees` Endpoint**: Multiple separate GET routes (`/my-team`, `/me`, `/:id`) have been consolidated into a single `/api/employees` route supporting query parameters (`?id=<id>` or `?team=true`).
* **Fixed Department Enum**: Standalone `Department` collection replaced with a fixed String enum on the `Employee` schema (`["Engineering", "HR", "Sales", "Finance", "Marketing", "Operations", "Legal", "IT", "Customer Support", "Admin"]`).
* **Unified `/api/auth/me` Response**: Returns both the `User` account details and the populated `Employee` profile in a single payload (`data: { user, profile }`).
* **Middleware-Driven Authorization**: All role-based access controls and manager team ownership checks are enforced via Express middleware (`authMiddleware` and `authorizeManagerAccess`), populating `req.user` and `req.employee`.
* **Transactional Seeding & Creation**: Admin seeding and user/employee provisioning operations execute within Mongoose sessions and transactions (`session.withTransaction`).
* **Clean API Responses**: Excludes Mongoose version key (`__v`) from database queries across all controllers.

---

## Folder Structure

The project follows a standard MVC-inspired directory structure for clean separation of concerns:

```text
Backend/
├── config/             # App configuration files
│   ├── db.js           # Mongoose MongoDB connection config
│   └── swagger.js      # Swagger OpenAPI 3.0 specification & tags
├── controllers/        # Request handlers & controller logic
│   ├── authController.js    # Registration, login, logout, me, refresh, role assignment
│   └── employeeController.js# Unified employee CRUD and query logic
├── middleware/         # Custom Express middleware
│   └── authMiddleware.js    # JWT authentication, role verification & manager ownership authorization
├── models/             # Mongoose schemas & data models
│   ├── Employee.js     # Unified employee profile schema (String department enum)
│   └── User.js         # Core authentication & user schema
├── routes/             # Express API route definitions
│   ├── authRoutes.js   # Authentication & user role routes
│   └── employeeRoutes.js   # Unified employee & team routes
├── scripts/            # Database utility scripts
│   └── seedAdmin.js    # Transactional initial Admin account creation script
├── utils/              # Helper utilities
│   └── createProfileForRole.js # Utility for provisioning employee profiles
├── .env                # Local environment variables (git-ignored)
├── .env.example        # Example environmental configuration template
├── package.json        # Project metadata, scripts, and dependencies
└── server.js           # Core entry point of the Express server
```

---

## Setup & Installation Instructions

Follow these steps to set up and run the project locally:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org) (v18+ recommended) and a running [MongoDB](https://www.mongodb.com) instance.

### 2. Navigate to Backend
```bash
cd Backend
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a local `.env` file in `Backend/` based on [.env.example](./.env.example):
```env
PORT=5000
MONGO_URL=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@hrms.com
ADMIN_PASSWORD=admin123
```

### 5. Seed the Initial Admin Account
Run the database transaction seeding script to create the initial Admin user and Employee record:
```bash
npm run seed:admin
```

### 6. Run the Application
* **Development Mode** (with nodemon reloading):
  ```bash
  npm run dev
  ```
* **Production Mode**:
  ```bash
  npm start
  ```

Once running, access the interactive Swagger API docs at:  
`http://localhost:5000/api-docs/`

---

## API Documentation Overview

### System & Auth Endpoints (`/api/auth`)

| Method | Endpoint | Role Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Server health and database connection status |
| `POST` | `/api/auth/register` | `admin` | Register a new user and create an associated role profile |
| `POST` | `/api/auth/login` | Public | Authenticates credentials; sets `accessToken` & `refreshToken` cookies |
| `POST` | `/api/auth/refresh` | Public | Refreshes and issues a new `accessToken` cookie |
| `POST` | `/api/auth/logout` | Public | Clears `accessToken` and `refreshToken` cookies |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current user account and employee profile (`data: { user, profile }`) |
| `PATCH` | `/api/auth/users/:id/role` | `admin` | Updates a specified user's system role |

### Employee Endpoints (`/api/employees`)

| Method | Endpoint | Query / Path Params | Role Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/employees` | None | `admin` | Provision a new employee user account and role profile |
| `GET` | `/api/employees` | None | `admin`, `manager` | List all active employees |
| `GET` | `/api/employees` | `?id=<id>` or `/:id` | `admin`, `manager` | Get specific employee by ID (manager ownership enforced via middleware) |
| `GET` | `/api/employees` | `?team=true` | `admin`, `manager` | Get direct reports for the logged-in manager |
| `PUT` | `/api/employees/:id` | `/:id` | `admin` | Update employee profile details by ID |
| `DELETE` | `/api/employees/:id` | `/:id` | `admin` | Soft delete an employee profile (`isActive: false`) |

---

## User Roles & Permissions

| Role | Permissions Overview |
| :--- | :--- |
| **Admin** | Full system access. Provision accounts, assign roles, update/delete employee records, and view all employees. |
| **Manager** | View all employees (`GET /api/employees`), view direct reports (`GET /api/employees?team=true`), and view individual employee details by ID for direct team members. |
| **Employee** | Access own user account and employee profile (`GET /api/auth/me`). |
