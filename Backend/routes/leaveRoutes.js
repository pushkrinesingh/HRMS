import express from "express";
import {
  applyLeave,
  decideLeave,
  getLeave,
} from "../controllers/leaveController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/apply", authMiddleware(), applyLeave);
router.post("/:id/decision", authMiddleware(["admin", "manager"]), decideLeave);
router.get("/", authMiddleware(), getLeave);

export default router;
