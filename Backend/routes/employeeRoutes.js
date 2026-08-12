import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getDepartmentEmployeeCounts,
  getMyProfile,
  getMyTeam,
} from "../controllers/employeeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware("admin"), createEmployee);

router.get("/", authMiddleware("admin"), getAllEmployees);

router.get("/me", authMiddleware(), getMyProfile);

router.get("/my-team", authMiddleware(), getMyTeam);

router.get(
  "/stats/department-count",
  authMiddleware("admin"),
  getDepartmentEmployeeCounts
);

router.get("/:id", authMiddleware(["admin", "manager"]), getEmployeeById);

router.put("/:id", authMiddleware("admin"), updateEmployee);

router.delete("/:id", authMiddleware("admin"), deleteEmployee);

export default router;
