const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "HRMS API Documentation",
    version: "1.0.0",
    description: "API endpoints for the Human Resource Management System (HRMS) Backend.\n\n### Demo Admin Credentials for Testing:\n- **Email:** `demo@hrms.com`\n- **Password:** `demo@123`\n- **Note:** Use this account to obtain an admin JWT token via POST `/api/auth/login`, required for accessing protected admin-only routes like POST `/api/employees`."
  },
  servers: [
    {
      url: "https://hrms-mjgh.onrender.com/",
      description: "Render Production Server"
    },
    {
      url: `http://localhost:${process.env.PORT || 5000}`,
      description: "Development Server"
    }
  ],
  tags: [
    {
      name: "Health",
      description: "Server health check endpoints"
    },
    {
      name: "Auth",
      description: "Authentication and registration endpoints"
    },
    {
      name: "Employees",
      description: "Employee management endpoints"
    },
    {
      name: "Attendance",
      description: "Attendance management endpoints (check-in/check-out and attendance history/summaries)"
    },
    {
      name: "Leave",
      description: "Leave management endpoints (apply leave, manager decisions, leave balances and histories)"
    }
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "accessToken"
      }
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["admin", "manager", "employee"] }
        }
      },
      Employee: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          department: {
            type: "string",
            enum: ["Engineering", "HR", "Sales", "Finance", "Marketing", "Operations", "Legal", "IT", "Customer Support", "Admin"]
          },
          designation: { type: "string" },
          manager: { type: "string", nullable: true },
          joiningDate: { type: "string", format: "date-time" },
          salary: {
            type: "object",
            properties: {
              basic: { type: "number" },
              hra: { type: "number" }
            }
          }
        }
      },
      Manager: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          department: {
            type: "string",
            enum: ["Engineering", "HR", "Sales", "Finance", "Marketing", "Operations", "Legal", "IT", "Customer Support", "Admin"]
          },
          designation: { type: "string" },
          salary: {
            type: "object",
            properties: {
              basic: { type: "number" },
              hra: { type: "number" }
            }
          }
        }
      },
      Attendance: {
        type: "object",
        properties: {
          _id: { type: "string" },
          employee: { type: "string" },
          date: { type: "string", format: "date-time" },
          checkIn: { type: "string", format: "date-time" },
          checkOut: { type: "string", format: "date-time", nullable: true },
          status: { type: "string", enum: ["present", "late", "half-day"] },
          workingHours: { type: "number", nullable: true }
        }
      },
      LeaveBalance: {
        type: "object",
        properties: {
          _id: { type: "string" },
          employee: { type: "string" },
          year: { type: "integer" },
          casual: {
            type: "object",
            properties: {
              total: { type: "integer" },
              used: { type: "integer" },
              pending: { type: "integer" },
              available: { type: "integer" }
            }
          },
          sick: {
            type: "object",
            properties: {
              total: { type: "integer" },
              used: { type: "integer" },
              pending: { type: "integer" },
              available: { type: "integer" }
            }
          },
          earned: {
            type: "object",
            properties: {
              total: { type: "integer" },
              used: { type: "integer" },
              pending: { type: "integer" },
              available: { type: "integer" }
            }
          }
        }
      },
      Leave: {
        type: "object",
        properties: {
          _id: { type: "string" },
          employee: { type: "string" },
          leaveType: { type: "string", enum: ["Casual", "Sick", "Earned", "LWP"] },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          numberOfDays: { type: "integer" },
          reason: { type: "string" },
          status: { type: "string", enum: ["pending", "approved", "rejected"] },
          approvedBy: { type: "string", nullable: true },
          approverComment: { type: "string", nullable: true }
        }
      }
    }
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "API Health Check",
        responses: {
          200: {
            description: "Server is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    status: { type: "string" },
                    message: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user and create profile (Admin only)",
        description: "For role='admin', department and manager fields are optional and can be omitted.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                  role: { type: "string", enum: ["admin", "manager", "employee"] },
                  department: {
                    type: "string",
                    enum: ["Engineering", "HR", "Sales", "Finance", "Marketing", "Operations", "Legal", "IT", "Customer Support", "Admin"]
                  },
                  designation: { type: "string" },
                  manager: { type: "string" },
                  joiningDate: { type: "string", format: "date-time" },
                  salary: {
                    type: "object",
                    properties: {
                      basic: { type: "number" },
                      hra: { type: "number" }
                    }
                  }
                }
              },
              example: {
                name: "Pushkrine Singh",
                email: "demo@hrms.com",
                password: "demo@123",
                role: "admin"
              }
            }
          }
        },
        responses: {
          201: {
            description: "User registered and profile created successfully"
          },
          400: {
            description: "User already exists or validation error"
          },
          403: {
            description: "Forbidden - Admin role required"
          }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Authenticate user and set cookies",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" }
                }
              },
              example: {
                email: "demo@hrms.com",
                password: "demo@123"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Login successful"
          },
          401: {
            description: "Invalid credentials"
          }
        }
      }
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate access token using refresh token",
        responses: {
          200: {
            description: "Token refreshed successfully"
          },
          401: {
            description: "Invalid or missing refresh token"
          }
        }
      }
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout user and clear cookies",
        responses: {
          200: {
            description: "Logged out successfully"
          }
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user account and employee profile",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "User account and employee profile details"
          },
          401: {
            description: "Not authorized"
          }
        }
      }
    },
    "/api/auth/users/{id}/role": {
      patch: {
        tags: ["Auth"],
        summary: "Update user role (Admin only)",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: { type: "string", enum: ["admin", "manager", "employee"] }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "User role updated successfully"
          },
          400: {
            description: "Invalid role specified"
          },
          404: {
            description: "User not found"
          }
        }
      }
    },
    "/api/employees": {
      get: {
        tags: ["Employees"],
        summary: "Get employees (list all, or fetch single employee by ?id=<id>, or filter by ?team=true)",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "query",
            required: false,
            description: "Employee ID to fetch a specific employee's details",
            schema: { type: "string" }
          },
          {
            name: "team",
            in: "query",
            required: false,
            description: "Set to 'true' to retrieve manager's direct report team members",
            schema: { type: "string" }
          }
        ],
        responses: {
          200: {
            description: "Employee details or list of employees"
          },
          403: {
            description: "Forbidden - Permission denied"
          }
        }
      },
      post: {
        tags: ["Employees"],
        summary: "Provision a profile for a user (Admin only)",
        security: [{ cookieAuth: [] }],
        description: "Creates a profile (Employee, Manager, or Admin record) for a user. You can provide an existing `userId` or pass new user credentials (`name`, `email`, `password`, `role`) to register the user and profile dynamically. Note: department and manager are required for role='manager' and role='employee', but optional for role='admin'.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "string" },
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                  role: { type: "string", enum: ["admin", "manager", "employee"] },
                  department: {
                    type: "string",
                    enum: ["Engineering", "HR", "Sales", "Finance", "Marketing", "Operations", "Legal", "IT", "Customer Support", "Admin"]
                  },
                  designation: { type: "string" },
                  manager: { type: "string" },
                  joiningDate: { type: "string", format: "date-time" },
                  salary: {
                    type: "object",
                    properties: {
                      basic: { type: "number" },
                      hra: { type: "number" }
                    }
                  }
                }
              },
              examples: {
                managerExample: {
                  summary: "Manager example",
                  value: {
                    name: "Rahul Verma",
                    email: "manager@hrms.com",
                    password: "Manager@123",
                    role: "manager",
                    department: "Engineering",
                    designation: "Engineering Manager",
                    manager: "<admin_or_top_manager_employee_id>",
                    joiningDate: "2024-01-15"
                  }
                },
                employeeExample: {
                  summary: "Employee example",
                  value: {
                    name: "Aditi Sharma",
                    email: "employee1@hrms.com",
                    password: "Employee@123",
                    role: "employee",
                    department: "Engineering",
                    designation: "Software Engineer",
                    manager: "<manager_employee_id>",
                    joiningDate: "2024-02-01"
                  }
                },
                invalidMissingDepartment: {
                  summary: "Invalid - missing department (should fail)",
                  value: {
                    name: "Test Rollback",
                    email: "rollbacktest@hrms.com",
                    password: "Test@123",
                    role: "employee",
                    designation: "QA Tester"
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Record created successfully"
          },
          400: {
            description: "Record already exists or validation error"
          },
          403: {
            description: "Forbidden - Admin role required"
          }
        }
      }
    },

    "/api/employees/{id}": {
      put: {
        tags: ["Employees"],
        summary: "Update employee details (Admin only)",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  department: {
                    type: "string",
                    enum: ["Engineering", "HR", "Sales", "Finance", "Marketing", "Operations", "Legal", "IT", "Customer Support", "Admin"]
                  },
                  designation: { type: "string" },
                  manager: { type: "string" },
                  joiningDate: { type: "string", format: "date-time" },
                  salary: {
                    type: "object",
                    properties: {
                      basic: { type: "number" },
                      hra: { type: "number" }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Employee record updated successfully"
          },
          404: {
            description: "Employee not found"
          }
        }
      },
      delete: {
        tags: ["Employees"],
        summary: "Delete employee record (Admin only)",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: {
            description: "Employee record deleted successfully"
          },
          404: {
            description: "Employee not found"
          }
        }
      }
    },
    "/api/attendance/toggle": {
      post: {
        tags: ["Attendance"],
        summary: "Toggle attendance check-in / check-out",
        description: "Automatically checks in if no record exists for today, or checks out if checked in but not yet checked out. Returns error 400 if already checked out for today.",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Check-out recorded successfully"
          },
          201: {
            description: "Check-in recorded successfully"
          },
          400: {
            description: "Validation error, employee profile missing, or already checked out for today"
          },
          401: {
            description: "Not authorized"
          }
        }
      }
    },
    "/api/attendance": {
      get: {
        tags: ["Attendance"],
        summary: "Get attendance records or monthly summary",
        description: "Single consolidated endpoint. Returns self attendance history by default, team attendance if ?team=true, specific employee attendance if ?id=<id> or ?employeeId=<id>, or monthly summary aggregation if ?summary=true (optionally with ?month=YYYY-MM).",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "query",
            required: false,
            description: "Employee ID to fetch specific employee attendance",
            schema: { type: "string" }
          },
          {
            name: "employeeId",
            in: "query",
            required: false,
            description: "Alias for employee ID",
            schema: { type: "string" }
          },
          {
            name: "team",
            in: "query",
            required: false,
            description: "Set to 'true' to view manager direct report team members' attendance",
            schema: { type: "string" }
          },
          {
            name: "summary",
            in: "query",
            required: false,
            description: "Set to 'true' to retrieve monthly aggregated summary (present, late, half-day, absent counts)",
            schema: { type: "string" }
          },
          {
            name: "month",
            in: "query",
            required: false,
            description: "Target month for summary in YYYY-MM format (defaults to current month)",
            schema: { type: "string" }
          }
        ],
        responses: {
          200: {
            description: "Attendance records or monthly summary"
          },
          403: {
            description: "Forbidden - Permission denied"
          },
          404: {
            description: "Employee record not found"
          }
        }
      }
    },
    "/api/leave/apply": {
      post: {
        tags: ["Leave"],
        summary: "Submit a new leave application",
        description: "Applies for leave. Validates available balance (for non-LWP). Auto-approves immediately if the applicant's role is 'admin'.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["leaveType", "startDate", "endDate", "reason"],
                properties: {
                  leaveType: { type: "string", enum: ["Casual", "Sick", "Earned", "LWP"] },
                  startDate: { type: "string", format: "date", example: "2026-08-25" },
                  endDate: { type: "string", format: "date", example: "2026-08-27" },
                  reason: { type: "string", example: "Personal work and doctor appointment" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Leave request submitted successfully (or auto-approved for admin)" },
          400: { description: "Insufficient balance or invalid parameters" },
          401: { description: "Not authorized" }
        }
      }
    },
    "/api/leave/{id}/decision": {
      post: {
        tags: ["Leave"],
        summary: "Approve or reject a leave request (Admin/Manager)",
        description: "Allows an applicant's direct manager or admin to approve or reject a pending leave request.",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Leave request ID",
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["action"],
                properties: {
                  action: { type: "string", enum: ["approve", "reject"] },
                  comment: { type: "string", example: "Approved. Enjoy your leave." }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Leave request decided successfully" },
          400: { description: "Invalid action or request already decided" },
          403: { description: "Forbidden - Not applicant's manager or admin" },
          404: { description: "Leave request not found" }
        }
      }
    },
    "/api/leave": {
      get: {
        tags: ["Leave"],
        summary: "Get leave requests or leave balances",
        description: "Single consolidated endpoint. Returns self leave history by default, team leave requests if ?team=true, pending requests if ?pending=true, single leave if ?id=<leaveId>, or leave balance if ?balance=true (optionally with ?employeeId=<id>).",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "query",
            required: false,
            description: "Leave request ID to fetch specific leave details",
            schema: { type: "string" }
          },
          {
            name: "employeeId",
            in: "query",
            required: false,
            description: "Employee ID (when combined with ?balance=true to fetch an employee's leave balance)",
            schema: { type: "string" }
          },
          {
            name: "team",
            in: "query",
            required: false,
            description: "Set to 'true' to view manager direct report team members' leave requests",
            schema: { type: "string" }
          },
          {
            name: "pending",
            in: "query",
            required: false,
            description: "Set to 'true' to filter leave requests by pending status (approval queue)",
            schema: { type: "string" }
          },
          {
            name: "balance",
            in: "query",
            required: false,
            description: "Set to 'true' to retrieve annual leave balance with calculated available days",
            schema: { type: "string" }
          }
        ],
        responses: {
          200: { description: "Leave records or balance details" },
          403: { description: "Forbidden - Permission denied" },
          404: { description: "Leave record or employee not found" }
        }
      }
    }
  }
};

export default swaggerDocument;
