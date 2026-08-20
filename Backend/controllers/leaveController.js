import mongoose from "mongoose";
import Leave from "../models/Leave.js";
import LeaveBalance, { formatLeaveBalanceWithAvailable } from "../models/LeaveBalance.js";
import Employee from "../models/Employee.js";

export const applyLeave = async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!req.employee) {
    return res.status(400).json({
      success: false,
      message: "Employee profile not found for the logged-in user",
    });
  }

  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields: leaveType, startDate, endDate, and reason",
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid start or end date format",
    });
  }

  const startNorm = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endNorm = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (endNorm < startNorm) {
    return res.status(400).json({
      success: false,
      message: "End date cannot be earlier than start date",
    });
  }

  const numberOfDays = Math.round((endNorm.getTime() - startNorm.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const year = startNorm.getFullYear();
  const isAdmin = req.user?.role === "admin" || req.employee?.role === "admin";

  const session = await mongoose.startSession();

  try {
    let createdLeave = null;

    await session.withTransaction(async () => {
      const typeKey = leaveType.toLowerCase();

      if (leaveType !== "LWP") {
        let balance = await LeaveBalance.findOne({
          employee: req.employee._id,
          year,
        }).session(session);

        if (!balance) {
          [balance] = await LeaveBalance.create(
            [
              {
                employee: req.employee._id,
                year,
              },
            ],
            { session }
          );
        }

        const typeBalance = balance[typeKey];
        if (!typeBalance) {
          const err = new Error(`Invalid leave type: ${leaveType}`);
          err.status = 400;
          throw err;
        }

        const available = typeBalance.total - typeBalance.used - typeBalance.pending;

        if (numberOfDays > available) {
          const err = new Error(
            `Insufficient ${leaveType} leave balance. Available: ${available} days, Requested: ${numberOfDays} days`
          );
          err.status = 400;
          throw err;
        }

        if (isAdmin) {
          balance[typeKey].used += numberOfDays;
        } else {
          balance[typeKey].pending += numberOfDays;
        }

        await balance.save({ session });
      }

      const status = isAdmin ? "approved" : "pending";
      const approvedBy = isAdmin ? req.employee._id : null;
      const approverComment = isAdmin ? "Auto-approved (admin)" : null;

      const [leaveDoc] = await Leave.create(
        [
          {
            employee: req.employee._id,
            leaveType,
            startDate: startNorm,
            endDate: endNorm,
            numberOfDays,
            reason,
            status,
            approvedBy,
            approverComment,
            createdBy: req.user?.id || null,
          },
        ],
        { session }
      );

      createdLeave = leaveDoc;
    });

    const isAutoApproved = isAdmin;
    return res.status(201).json({
      success: true,
      message: isAutoApproved
        ? "Leave request submitted and auto-approved (admin)"
        : "Leave request submitted successfully",
      data: createdLeave,
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
  } finally {
    await session.endSession();
  }
};

export const decideLeave = async (req, res) => {
  const { id } = req.params;
  const { action, comment } = req.body;

  if (!action || !["approve", "reject"].includes(action)) {
    return res.status(400).json({
      success: false,
      message: "Action is required and must be either 'approve' or 'reject'",
    });
  }

  const session = await mongoose.startSession();

  try {
    let updatedLeave = null;

    await session.withTransaction(async () => {
      const leave = await Leave.findById(id).session(session);

      if (!leave) {
        const err = new Error("Leave request not found");
        err.status = 404;
        throw err;
      }

      if (leave.status !== "pending") {
        const err = new Error("This leave request has already been decided.");
        err.status = 400;
        throw err;
      }

      const applicantEmployee = await Employee.findById(leave.employee).session(session);
      if (!applicantEmployee) {
        const err = new Error("Applicant employee record not found");
        err.status = 404;
        throw err;
      }

      const targetManagerId = applicantEmployee.manager?._id?.toString() || applicantEmployee.manager?.toString();
      const isManager = req.employee && targetManagerId === req.employee._id.toString();
      const isAdmin = req.user?.role === "admin";

      if (!isAdmin && !isManager) {
        const err = new Error("Not authorized to decide on this leave request");
        err.status = 403;
        throw err;
      }

      const year = new Date(leave.startDate).getFullYear();
      const typeKey = leave.leaveType.toLowerCase();

      if (leave.leaveType !== "LWP") {
        let balance = await LeaveBalance.findOne({
          employee: leave.employee,
          year,
        }).session(session);

        if (!balance) {
          [balance] = await LeaveBalance.create(
            [
              {
                employee: leave.employee,
                year,
              },
            ],
            { session }
          );
        }

        if (action === "approve") {
          balance[typeKey].pending = Math.max(0, balance[typeKey].pending - leave.numberOfDays);
          balance[typeKey].used += leave.numberOfDays;
        } else if (action === "reject") {
          balance[typeKey].pending = Math.max(0, balance[typeKey].pending - leave.numberOfDays);
        }

        await balance.save({ session });
      }

      leave.status = action === "approve" ? "approved" : "rejected";
      leave.approvedBy = req.employee?._id || null;
      leave.approverComment = comment || null;
      leave.updatedBy = req.user?.id || null;

      await leave.save({ session });
      updatedLeave = leave;
    });

    return res.status(200).json({
      success: true,
      message: `Leave request ${action}d successfully`,
      data: updatedLeave,
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
  } finally {
    await session.endSession();
  }
};

export const getLeave = async (req, res) => {
  const { id, employeeId, team, myTeam, scope, pending, balance } = req.query;
  const isTeam = team === "true" || myTeam === "true" || scope === "team";
  const isPending = pending === "true";
  const isBalance = balance === "true";

  try {
    if (isBalance) {
      const targetId = employeeId || id;
      let targetEmployeeId;

      if (targetId) {
        const isAdmin = req.user?.role === "admin";
        if (!isAdmin) {
          if (req.user?.role === "employee" && req.employee?._id.toString() !== targetId) {
            return res.status(403).json({
              success: false,
              message: "Not authorized to view this employee's leave balance",
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
                message: "Not authorized to view this employee's leave balance",
              });
            }
          }
        }
        targetEmployeeId = targetId;
      } else {
        if (!req.employee) {
          return res.status(200).json({ success: true, data: null });
        }
        targetEmployeeId = req.employee._id;
      }

      const currentYear = new Date().getFullYear();
      let balanceDoc = await LeaveBalance.findOne({
        employee: targetEmployeeId,
        year: currentYear,
      }).select("-__v");

      if (!balanceDoc) {
        balanceDoc = await LeaveBalance.create({
          employee: targetEmployeeId,
          year: currentYear,
        });
      }

      return res.status(200).json({
        success: true,
        data: formatLeaveBalanceWithAvailable(balanceDoc),
      });
    }

    if (id) {
      const leaveRecord = await Leave.findById(id)
        .select("-__v")
        .populate({
          path: "employee",
          select: "user department designation manager",
          populate: { path: "user", select: "name email role" },
        })
        .populate({
          path: "approvedBy",
          select: "user designation",
          populate: { path: "user", select: "name email" },
        });

      if (!leaveRecord) {
        return res.status(404).json({
          success: false,
          message: "Leave request not found",
        });
      }

      const isAdmin = req.user?.role === "admin";
      const applicantEmpId = leaveRecord.employee?._id?.toString() || leaveRecord.employee?.toString();
      const applicantManagerId = leaveRecord.employee?.manager?.toString();

      if (!isAdmin) {
        if (req.user?.role === "employee" && req.employee?._id.toString() !== applicantEmpId) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to view this leave request",
          });
        }

        if (
          req.user?.role === "manager" &&
          req.employee?._id.toString() !== applicantEmpId &&
          applicantManagerId !== req.employee?._id.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to view this leave request",
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: leaveRecord,
      });
    }

    if (isTeam) {
      if (!req.employee) {
        return res.status(200).json({ success: true, data: [] });
      }

      const teamMembers = await Employee.find({ manager: req.employee._id, isActive: true }).select("_id");
      const teamIds = teamMembers.map((m) => m._id);

      const queryFilter = { employee: { $in: teamIds } };
      if (isPending) {
        queryFilter.status = "pending";
      }

      const records = await Leave.find(queryFilter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .populate({
          path: "employee",
          select: "user department designation",
          populate: { path: "user", select: "name email role" },
        })
        .populate({
          path: "approvedBy",
          select: "user designation",
          populate: { path: "user", select: "name email" },
        });

      return res.status(200).json({
        success: true,
        data: records,
      });
    }

    if (isPending) {
      let queryFilter = { status: "pending" };

      if (req.user?.role === "manager") {
        if (!req.employee) {
          return res.status(200).json({ success: true, data: [] });
        }
        const teamMembers = await Employee.find({ manager: req.employee._id, isActive: true }).select("_id");
        const teamIds = teamMembers.map((m) => m._id);
        queryFilter = { employee: { $in: teamIds }, status: "pending" };
      } else if (req.user?.role === "employee") {
        if (!req.employee) {
          return res.status(200).json({ success: true, data: [] });
        }
        queryFilter = { employee: req.employee._id, status: "pending" };
      }

      const records = await Leave.find(queryFilter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .populate({
          path: "employee",
          select: "user department designation",
          populate: { path: "user", select: "name email role" },
        })
        .populate({
          path: "approvedBy",
          select: "user designation",
          populate: { path: "user", select: "name email" },
        });

      return res.status(200).json({
        success: true,
        data: records,
      });
    }

    if (!req.employee) {
      return res.status(200).json({ success: true, data: [] });
    }

    const records = await Leave.find({ employee: req.employee._id })
      .select("-__v")
      .sort({ createdAt: -1 })
      .populate({
        path: "employee",
        select: "user department designation",
        populate: { path: "user", select: "name email role" },
      })
      .populate({
        path: "approvedBy",
        select: "user designation",
        populate: { path: "user", select: "name email" },
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
