import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import { createProfileForRole } from "../utils/createProfileForRole.js";

export const createEmployee = async (req, res) => {
  const { userId, name, email, password, role, department, designation, manager, joiningDate, salary } = req.body;

  const session = await mongoose.startSession();
  try {
    let profileData;
    let finalRole = role || "employee";

    await session.withTransaction(async () => {
      let finalUserId = userId;

      if (!finalUserId) {
        if (!name || !email || !password) {
          const error = new Error("Please provide user details (name, email, password) to create a new user account");
          error.status = 400;
          throw error;
        }

        const existingUser = await User.findOne({ email }).session(session).select("-__v");
        if (existingUser) {
          const error = new Error("User already exists with this email");
          error.status = 400;
          throw error;
        }

        const [user] = await User.create(
          [
            {
              name,
              email,
              password,
              role: finalRole,
              createdBy: req.user?.id || null,
            },
          ],
          { session }
        );

        finalUserId = user._id;
      } else {
        const userExists = await User.findById(finalUserId).session(session).select("-__v");
        if (!userExists) {
          const error = new Error("Referenced user not found");
          error.status = 404;
          throw error;
        }
        finalRole = userExists.role;
      }

      profileData = await createProfileForRole({
        userId: finalUserId,
        role: finalRole,
        department,
        designation,
        manager,
        joiningDate,
        salary,
        createdBy: req.user?.id || null,
        session,
      });
    });

    return res.status(201).json({
      success: true,
      message: `${finalRole.charAt(0).toUpperCase() + finalRole.slice(1)} record created successfully`,
      data: profileData,
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

export const getEmployees = async (req, res) => {
  const employeeId = req.params.id || req.query.id;
  const { team, myTeam, scope } = req.query;
  const isTeam = team === "true" || myTeam === "true" || scope === "team";

  try {
    if (isTeam) {
      if (!req.employee) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }

      const teamMembers = await Employee.find({ manager: req.employee._id, isActive: true })
        .select("-__v")
        .populate("user", "name email role");

      return res.status(200).json({
        success: true,
        data: teamMembers,
      });
    }

    if (employeeId) {
      const employee = await Employee.findOne({ _id: employeeId, isActive: true })
        .select("-__v")
        .populate("user", "name email role")
        .populate({
          path: "manager",
          populate: { path: "user", select: "name" },
          select: "designation",
        });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee record not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: employee,
      });
    }

    const employees = await Employee.find({ isActive: true })
      .select("-__v")
      .populate("user", "name email role")
      .populate({
        path: "manager",
        populate: { path: "user", select: "name" },
        select: "designation",
      });

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getAllEmployees = getEmployees;
export const getEmployeeById = getEmployees;
export const getMyProfile = getEmployees;
export const getMyTeam = getEmployees;

export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updateData = {
      ...updates,
      updatedBy: req.user?.id || null,
    };

    const employee = await Employee.findOneAndUpdate(
      { _id: id, isActive: true },
      updateData,
      { new: true, runValidators: true }
    ).select("-__v");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee record updated successfully",
      data: employee,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findOneAndUpdate(
      { _id: id, isActive: true },
      { isActive: false, updatedBy: req.user?.id || null },
      { new: true }
    ).select("-__v");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee record deleted successfully",
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

