import express from "express";
import {
  upsertSalaryStructure,
  getSalaryStructure,
  triggerPayslipGeneration,
  getPayslips,
} from "../controllers/payrollController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Salary Structure routes
router.post("/salary-structure", authMiddleware("admin"), upsertSalaryStructure);
router.get("/salary-structure", authMiddleware(), getSalaryStructure);

// Payslip routes
router.post("/generate", authMiddleware("admin"), triggerPayslipGeneration);
router.get("/payslips", authMiddleware(), getPayslips);

export default router;
