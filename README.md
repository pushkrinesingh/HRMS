# HRMS - Human Resource Management System

HRMS (Human Resource Management System) is a full-stack web application designed to streamline core organizational HR processes, including employee directory management, user authentication, and role-based access control (RBAC). The project is structured into two decoupled modules: **Frontend** and **Backend**.

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

### Key Backend Features & Enhancements
* **Role-Based Access Control (RBAC)**: Enforces specific permissions across three roles:
  * **Admin**: Complete system access — provision employee accounts, update/delete employee records, and view all employees.
  * **Manager**: Access employee directory, view direct reports (`?team=true`), and view direct report details by ID.
  * **Employee**: Access personal account and employee profile details via `/api/auth/me`.
* **Unified `GET /api/employees` Endpoint**: Consolidated all employee GET operations into a single endpoint supporting query parameters (`?id=<id>` or `?team=true`).
* **Fixed Department Enum**: Department field on `Employee` model uses a static String enum (`Engineering`, `HR`, `Sales`, `Finance`, `Marketing`, `Operations`, `Legal`, `IT`, `Customer Support`, `Admin`).
* **Middleware Authorization**: `authMiddleware` attaches `req.employee` and `authorizeManagerAccess` validates manager ownership in middleware.
* **Interactive API Documentation**: Swagger UI integration accessible via `/api-docs/`.

### Backend Key API Endpoints

| Category | Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Public | Server health and database connection status check |
| **Auth** | `POST` | `/api/auth/register` | Admin | Register new users and assign role profiles |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate user credentials and set auth cookies |
| **Auth** | `POST` | `/api/auth/refresh` | Public | Refresh expired access tokens |
| **Auth** | `POST` | `/api/auth/logout` | Public | Log out user and clear authorization cookies |
| **Auth** | `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user account and employee profile |
| **Employees** | `POST` | `/api/employees` | Admin | Provision a new employee user and role profile |
| **Employees** | `GET` | `/api/employees` | Admin, Manager | Retrieve all employee profiles or filter via query params (`?id=<id>` or `?team=true`) |
| `Employees` | `PUT` | `/api/employees/:id` | Admin | Update existing employee details |
| `Employees` | `DELETE` | `/api/employees/:id` | Admin | Soft delete an employee profile |

### Backend Setup & Commands
Navigate to the `Backend` directory:
```bash
cd Backend
npm install
```

Available scripts:
* `npm run dev`: Launches the backend server with `nodemon` for auto-reloading during development.
* `npm start`: Starts the production Node.js server.
* `npm run seed:admin`: Seeds the initial Admin user and Employee record into the database.
