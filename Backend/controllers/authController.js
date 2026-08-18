import mongoose from "mongoose";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createProfileForRole } from "../utils/createProfileForRole.js";

export const register = async (req, res) => {
  const { name, email, password, role, department, designation, manager, joiningDate, salary } = req.body;

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const existingUser = await User.findOne({ email }).session(session).select("-__v");
      if (existingUser) {
        const error = new Error("User already exists with this email");
        error.status = 400;
        throw error;
      }

      const userRole = role || "employee";
      const [user] = await User.create(
        [
          {
            name,
            email,
            password,
            role: userRole,
            createdBy: req.user?.id || null,
          },
        ],
        { session }
      );

      const profileData = await createProfileForRole({
        userId: user._id,
        role: user.role,
        department,
        designation,
        manager,
        joiningDate,
        salary,
        createdBy: req.user?.id || null,
        session,
      });

      const userResponse = user.toObject();
      delete userResponse.password;

      result = {
        user: userResponse,
        profile: profileData,
      };
    });

    return res.status(201).json({
      success: true,
      message: "User registered and profile created successfully",
      data: result,
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

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("-__v");
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      accessToken,
      user: userResponse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token missing",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select("-__v");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or disabled",
      });
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -__v");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const profile = await Employee.findOne({ user: user._id, isActive: true })
      .select("-__v")
      .populate({
        path: "manager",
        populate: { path: "user", select: "name email" },
        select: "designation",
      });

    return res.status(200).json({
      success: true,
      data: {
        user,
        profile: profile || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["admin", "manager", "employee"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role specified",
    });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { role, updatedBy: req.user?.id || null },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
