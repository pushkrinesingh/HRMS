import express from "express";
import {
  toggleAttendance,
  getAttendance,
} from "../controllers/attendanceController.js";
import {
  authMiddleware,
  authorizeManagerAccess,
} from "../middleware/authMiddleware.js";

const router = express.Router();

const mapEmployeeIdQuery = (req, res, next) => {
  if (req.query.employeeId && !req.query.id) {
    req.query.id = req.query.employeeId;
  }
  next();
};

router.post("/toggle", authMiddleware(), toggleAttendance);
router.get("/", authMiddleware(), mapEmployeeIdQuery, authorizeManagerAccess, getAttendance);

export default router;
