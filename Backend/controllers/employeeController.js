import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
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

        const existingUser = await User.findOne({ email }).session(session);
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
        const userExists = await User.findById(finalUserId).session(session);
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
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  } finally {
    await session.endSession();
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true })
      .populate("user", "name email role")
      .populate("department", "name")
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

export const getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user.id, isActive: true })
      .populate("user", "name email role")
      .populate("department", "name")
      .populate({
        path: "manager",
        populate: { path: "user", select: "name email" },
        select: "designation",
      });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found for logged-in user",
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};


export const getMyTeam = async (req, res) => {
  try {
    const myEmployee = await Employee.findOne({ user: req.user.id, isActive: true });

    if (!myEmployee) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const team = await Employee.find({ manager: myEmployee._id, isActive: true })
      .populate("user", "name email role")
      .populate("department", "name");

    return res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getEmployeeById = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findOne({ _id: id, isActive: true })
      .populate("user", "name email role")
      .populate("department", "name")
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
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

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
    );

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
    );

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

export const getDepartmentEmployeeCounts = async (req, res) => {
  try {
    const stats = await Employee.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: "$department",
          employeeCount: { $sum: 1 },
        },
      },
    ]);

    const populatedStats = await Department.populate(stats, {
      path: "_id",
      select: "name",
    });

    const formattedStats = populatedStats.map((item) => ({
      departmentId: item._id?._id || item._id,
      departmentName: item._id?.name || "Unknown",
      employeeCount: item.employeeCount,
    }));

    return res.status(200).json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
