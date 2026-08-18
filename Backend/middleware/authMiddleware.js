import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

export const authMiddleware = (allowedRoles = []) => {
  const roles = typeof allowedRoles === "string" ? [allowedRoles] : (Array.isArray(allowedRoles) ? allowedRoles : []);

  return async (req, res, next) => {
    const token = req.cookies.accessToken;
    let authenticatedUser = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        authenticatedUser = decoded;
      } catch (error) {
        console.error("Auth middleware access token verification failed, attempting silent refresh:", error.message);
      }
    }

    if (!authenticatedUser) {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, token is invalid or expired, and no refresh token provided",
        });
      }

      try {
        const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decodedRefresh.id).select("-__v");
        if (!user) {
          return res.status(401).json({
            success: false,
            message: "Not authorized, user not found or disabled",
          });
        }

        const newAccessToken = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "15m" }
        );

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 15 * 60 * 1000,
        });

        authenticatedUser = { id: user._id, role: user.role };
      } catch (refreshError) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, session expired",
        });
      }
    }

    req.user = authenticatedUser;
    req.employee = await Employee.findOne({ user: req.user.id, isActive: true }).select("-__v");

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

export const authorizeManagerAccess = async (req, res, next) => {
  const targetId = req.params.id || req.query.id;
  if (!targetId || targetId === "me" || req.user?.role === "admin") {
    return next();
  }

  if (req.user?.role === "manager") {
    const employee = await Employee.findOne({ _id: targetId, isActive: true }).select("-__v");
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found",
      });
    }

    const targetManagerId = employee.manager?._id?.toString() || employee.manager?.toString();
    if (!req.employee || targetManagerId !== req.employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this employee's details",
      });
    }
  }

  next();
};
