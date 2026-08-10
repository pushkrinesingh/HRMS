import express from "express";
import { createDepartment, getAllDepartments } from "../controllers/departmentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware("admin"), createDepartment);

router.get("/", authMiddleware(), getAllDepartments);

export default router;
