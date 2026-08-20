import express from "express";
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";
import { authMiddleware, authorizeManagerAccess } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware("admin"), createEmployee);
router.get("/", authMiddleware(), authorizeManagerAccess, getEmployees);
router.put("/:id", authMiddleware("admin"), updateEmployee);
router.delete("/:id", authMiddleware("admin"), deleteEmployee);

export default router;
