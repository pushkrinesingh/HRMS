import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

/**
 * Helper to compute Mon-Fri working days elapsed in a given month range up to today/endDate.
 */
const getWorkingDaysElapsed = (startDate, endDate) => {
  const today = new Date();
  let lastDate;
  if (today < startDate) {
    lastDate = new Date(startDate.getTime() - 1);
  } else if (today > endDate) {
    lastDate = endDate;
  } else {
    lastDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  let count = 0;
  const current = new Date(startDate);
  while (current <= lastDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

export const toggleAttendance = async (req, res) => {
  try {
    if (!req.employee) {
      return res.status(400).json({
        success: false,
        message: "Employee profile not found for the logged-in user",
      });
    }

    const now = new Date();
    const todayNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let attendance = await Attendance.findOne({
      employee: req.employee._id,
      date: todayNormalized,
    });

    if (!attendance) {
      const checkInHour = now.getHours();
      const status = checkInHour < 9 ? "present" : "late";

      attendance = await Attendance.create({
        employee: req.employee._id,
        date: todayNormalized,
        checkIn: now,
        checkOut: null,
        status,
        createdBy: req.user?.id || null,
      });

      return res.status(201).json({
        success: true,
        message: `Check-in recorded successfully (${status})`,
        data: attendance,
      });
    }

    if (attendance.checkOut !== null) {
      return res.status(400).json({
        success: false,
        message: "Already checked out for today. Attendance is complete.",
      });
    }

    const checkOut = now;
    const diffMs = checkOut.getTime() - new Date(attendance.checkIn).getTime();
    const workingHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

    attendance.checkOut = checkOut;
    attendance.workingHours = workingHours;
    if (workingHours < 4) {
      attendance.status = "half-day";
    }
    attendance.updatedBy = req.user?.id || null;

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Check-out recorded successfully",
      data: attendance,
    });
  } catch (error) {
    const statusCode =
      error.name === "ValidationError" || error.name === "CastError"
        ? 400
        : error.status || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getAttendance = async (req, res) => {
  const targetId = req.query.id || req.query.employeeId;
  const { team, myTeam, scope, summary, month } = req.query;
  const isTeam = team === "true" || myTeam === "true" || scope === "team";
  const isSummary = summary === "true";

  try {
    if (isSummary) {
      let year, monthNum;
      if (month && /^\d{4}-\d{2}$/.test(month)) {
        const parts = month.split("-");
        year = parseInt(parts[0], 10);
        monthNum = parseInt(parts[1], 10);
      } else {
        const now = new Date();
        year = now.getFullYear();
        monthNum = now.getMonth() + 1;
      }

      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
      const workingDaysElapsed = getWorkingDaysElapsed(startDate, endDate);

      let targetEmployeeIds = [];

      if (targetId) {
        if (req.user?.role === "employee" && req.employee?._id.toString() !== targetId) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to view this employee's attendance summary",
          });
        }

        if (req.user?.role === "manager" && req.employee?._id.toString() !== targetId) {
          const targetEmp = await Employee.findOne({ _id: targetId, isActive: true }).select("-__v");
          if (!targetEmp) {
            return res.status(404).json({
              success: false,
              message: "Employee record not found",
            });
          }
          const targetManagerId = targetEmp.manager?._id?.toString() || targetEmp.manager?.toString();
          if (targetManagerId !== req.employee?._id.toString()) {
            return res.status(403).json({
              success: false,
              message: "Not authorized to view this employee's attendance summary",
            });
          }
        }

        targetEmployeeIds = [new mongoose.Types.ObjectId(targetId)];
      } else if (isTeam || req.user?.role === "manager") {
        if (!req.employee) {
          return res.status(200).json({ success: true, data: [] });
        }
        const teamMembers = await Employee.find({ manager: req.employee._id, isActive: true }).select("_id");
        targetEmployeeIds = teamMembers.map((m) => m._id);
      } else if (req.user?.role === "admin") {
        const allEmps = await Employee.find({ isActive: true }).select("_id");
        targetEmployeeIds = allEmps.map((e) => e._id);
      } else {
        if (!req.employee) {
          return res.status(200).json({ success: true, data: [] });
        }
        targetEmployeeIds = [req.employee._id];
      }

      const aggregated = await Attendance.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            employee: { $in: targetEmployeeIds },
          },
        },
        {
          $group: {
            _id: "$employee",
            present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
            halfDay: { $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] } },
            totalRecords: { $sum: 1 },
          },
        },
      ]);

      const aggMap = new Map();
      aggregated.forEach((item) => {
        aggMap.set(item._id.toString(), item);
      });

      const employeesData = await Employee.find({ _id: { $in: targetEmployeeIds } })
        .select("-__v")
        .populate("user", "name email role");

      const summaryResult = employeesData.map((emp) => {
        const stats = aggMap.get(emp._id.toString()) || {
          present: 0,
          late: 0,
          halfDay: 0,
          totalRecords: 0,
        };
        const absent = Math.max(0, workingDaysElapsed - stats.totalRecords);

        return {
          employee: {
            _id: emp._id,
            department: emp.department,
            designation: emp.designation,
            user: emp.user,
          },
          month: `${year}-${String(monthNum).padStart(2, "0")}`,
          workingDaysElapsed,
          present: stats.present,
          late: stats.late,
          halfDay: stats.halfDay,
          absent,
          totalRecords: stats.totalRecords,
        };
      });

      return res.status(200).json({
        success: true,
        data: summaryResult,
      });
    }

    if (isTeam) {
      if (!req.employee) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }

      const teamMembers = await Employee.find({ manager: req.employee._id, isActive: true }).select("_id");
      const teamIds = teamMembers.map((m) => m._id);

      const records = await Attendance.find({ employee: { $in: teamIds } })
        .select("-__v")
        .sort({ date: -1 })
        .populate({
          path: "employee",
          select: "user department designation",
          populate: { path: "user", select: "name email role" },
        });

      return res.status(200).json({
        success: true,
        data: records,
      });
    }

    if (targetId) {
      if (req.user?.role === "employee" && req.employee?._id.toString() !== targetId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this employee's attendance details",
        });
      }

      const records = await Attendance.find({ employee: targetId })
        .select("-__v")
        .sort({ date: -1 })
        .populate({
          path: "employee",
          select: "user department designation",
          populate: { path: "user", select: "name email role" },
        });

      return res.status(200).json({
        success: true,
        data: records,
      });
    }

    if (!req.employee) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const records = await Attendance.find({ employee: req.employee._id })
      .select("-__v")
      .sort({ date: -1 })
      .populate({
        path: "employee",
        select: "user department designation",
        populate: { path: "user", select: "name email role" },
      });

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    const statusCode =
      error.name === "ValidationError" || error.name === "CastError"
        ? 400
        : error.status || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
