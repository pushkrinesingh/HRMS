# HRMS - Human Resource Management System

HRMS (Human Resource Management System) is a full-stack web application designed to streamline core organizational HR processes, including employee directory management, department structures, user authentication, and role-based access control (RBAC). The project is structured into two decoupled modules: **Frontend** and **Backend**.

---

## 🏗️ Project Architecture Overview

```text
HRMS/
├── Frontend/    # Client-side user interface (React + Vite)
└── Backend/     # Server-side RESTful API (Node.js + Express + MongoDB)
```

---

## 🎨 Frontend

The client-side user interface built with modern web technologies for fast rendering and efficient development.

### Tech Stack
* **Framework / Library**: React 19
* **Build Tool & Dev Server**: Vite
* **Styling**: CSS3 (CSS Variables, Flexbox, Grid)
* **Code Quality**: ESLint

### What it Includes
* **Single Page Application Structure**: Modular architecture powered by React components and Vite Hot Module Replacement (HMR) for local development.
* **Component Architecture**: Reusable UI components and asset management.
* **Modern UI Components & Assets**: Layout components, icons, and structured styling assets.

### Frontend Setup & Commands
Navigate to the `Frontend` directory:
```bash
cd Frontend
npm install
```

Available scripts:
* `npm run dev`: Starts the Vite local development server.
* `npm run build`: Compiles and bundles the application for production deployment.
* `npm run preview`: Previews the production build locally.
* `npm run lint`: Executes ESLint to enforce code standards.

---

## ⚙️ Backend

A robust and scalable Node.js/Express RESTful API implementing secure authentication, role-based authorization, and database management with MongoDB.

### Tech Stack
* **Runtime Environment**: Node.js
* **Web Framework**: Express (v5)
* **Database & ODM**: MongoDB with Mongoose
* **Authentication & Security**: JSON Web Tokens (JWT) in secure HTTP-Only cookies, password hashing via `bcryptjs`
* **API Documentation**: Swagger UI (`swagger-ui-express`)
* **Middleware & Utilities**: CORS, Cookie Parser

### What it Includes
* **Role-Based Access Control (RBAC)**: Enforces specific permissions across three roles:
  * **Admin**: Complete system access — create departments, provision employee accounts, update/delete employee records, and view department headcount statistics.
  * **Manager**: Read-only access to employee listings and individual employee details.
  * **Employee**: Read-only access to personal profile details.
* **Authentication System**: Secure login and session handling using short-lived access tokens and long-lived refresh tokens with automated cookie management.
* **Department Management**: API endpoints to create and list organizational departments.
* **Employee Management**: Full CRUD capabilities for provisioning and managing employee profiles, populated with User and Department associations.
* **Interactive API Documentation**: Swagger UI integration accessible via `/api-docs/`.
* **Database Seeding**: Utility script to seed an initial Administrator account into the database.

### Backend Directory Structure
```text
Backend/
├── config/         # Database connection and Swagger API documentation setup
├── controllers/    # API request handling logic (Auth, Department, Employee)
├── middleware/     # Authentication and Role-Based Access Control middleware
├── models/         # Mongoose database schemas (User, Admin, Manager, Employee, Department)
├── routes/         # Express API route definitions
├── scripts/        # Administrative database seeding utilities
└── server.js       # Entry point for the Express server
```

### Key API Endpoints

| Category | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET /api/health` | Public | Server health and database connection status check |
| **Auth** | `POST /api/auth/register` | Admin | Register new users and assign role profiles |
| **Auth** | `POST /api/auth/login` | Public | Authenticate user credentials and set auth cookies |
| **Auth** | `POST /api/auth/refresh` | Public | Refresh expired access tokens |
| **Auth** | `POST /api/auth/logout` | Public | Log out user and clear authorization cookies |
| **Auth** | `GET /api/auth/me` | Authenticated | Retrieve authenticated user profile |
| **Departments** | `POST /api/departments` | Admin | Create a new department |
| **Departments** | `GET /api/departments` | Authenticated | Retrieve list of all departments |
| **Employees** | `POST /api/employees` | Admin | Provision a new employee user and role profile |
| **Employees** | `GET /api/employees` | Admin, Manager | Retrieve all employee profiles with populated references |
| **Employees** | `GET /api/employees/stats/department-count` | Admin | Aggregate employee headcount grouped by department |
| **Employees** | `GET /api/employees/:id` | Admin, Manager | Get individual employee details by ID |
| **Employees** | `PUT /api/employees/:id` | Admin | Update existing employee details |
| **Employees** | `DELETE /api/employees/:id` | Admin | Delete an employee profile |

### Backend Setup & Commands
Navigate to the `Backend` directory:
```bash
cd Backend
npm install
```

Available scripts:
* `npm run dev`: Launches the backend server with `nodemon` for auto-reloading during development.
* `npm start`: Starts the production Node.js server.
* `npm run seed:admin`: Seeds the initial Admin user account into the database.
