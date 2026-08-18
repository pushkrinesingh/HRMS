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
        summary: "Get current user profile",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "User profile details"
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
        summary: "Get list of all employees (Admin & Manager)",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "List of employees"
          },
          403: {
            description: "Forbidden - Requires Admin/Manager role"
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
    "/api/employees/me": {
      get: {
        tags: ["Employees"],
        summary: "Get employee profile for logged-in user",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Logged in user employee profile"
          },
          404: {
            description: "Employee profile not found for logged-in user"
          }
        }
      }
    },
    "/api/employees/my-team": {
      get: {
        tags: ["Employees"],
        summary: "Get team members for logged-in manager",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "List of direct report team members"
          }
        }
      }
    },
    "/api/employees/{id}": {
      get: {
        tags: ["Employees"],
        summary: "Get employee details by ID (Admin & Manager)",
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
            description: "Employee details"
          },
          403: {
            description: "Forbidden - Not authorized to view this employee's details"
          },
          404: {
            description: "Employee not found"
          }
        }
      },
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
    }
  }
};

export default swaggerDocument;
