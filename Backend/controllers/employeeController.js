import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Admin from "../models/Admin.js";
import Manager from "../models/Manager.js";
import bcrypt from "bcryptjs";

export const createEmployee = async (req, res) => {
  const { userId, name, email, password, role, department, designation, manager, joiningDate, salary } = req.body;

  try {
    let finalUserId = userId;
    let finalRole = role || "employee";

    if (!finalUserId) {
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Please provide user details (name, email, password) to create a new user account",
        });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: finalRole,
      });

      await user.save();
      finalUserId = user._id;
    } else {
      const userExists = await User.findById(finalUserId);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "Referenced user not found",
        });
      }
      finalRole = userExists.role;
    }

    let profileData = null;

    if (finalRole === "admin") {
      const exists = await Admin.findOne({ user: finalUserId });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "An admin record already exists for this user",
        });
      }

      const admin = new Admin({ user: finalUserId });
      await admin.save();
      profileData = admin;
    } else if (finalRole === "manager") {
      const exists = await Manager.findOne({ user: finalUserId });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "A manager record already exists for this user",
        });
      }

      const managerProfile = new Manager({
        user: finalUserId,
        department,
        designation,
        salary,
      });
      await managerProfile.save();
      profileData = managerProfile;
    } else if (finalRole === "employee") {
      const exists = await Employee.findOne({ user: finalUserId });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "An employee record already exists for this user",
        });
      }

      const employee = new Employee({
        user: finalUserId,
        department,
        designation,
        manager: manager || null,
        joiningDate,
        salary,
      });
      await employee.save();
      profileData = employee;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

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
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
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

export const getEmployeeById = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findById(id)
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
    const employee = await Employee.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

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
    const employee = await Employee.findByIdAndDelete(id);

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
