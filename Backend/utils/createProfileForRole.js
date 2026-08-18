import mongoose from "mongoose";
import Employee from "../models/Employee.js";

export const createProfileForRole = async ({
  userId,
  role,
  department,
  designation,
  manager,
  joiningDate,
  salary,
  createdBy,
  session: callerSession,
}) => {
  const executeProfileCreation = async (session) => {
    const query = Employee.findOne({ user: userId }).select("-__v");
    if (session) {
      query.session(session);
    }
    const exists = await query;
    if (exists) {
      const error = new Error("An employee record already exists for this user");
      error.status = 400;
      throw error;
    }

    const employeeData = {
      user: userId,
      role,
      department: department || null,
      designation: designation || (role === "admin" ? "System Administrator" : undefined),
      manager: manager || null,
      joiningDate: joiningDate || (role === "admin" ? new Date() : undefined),
      salary,
      createdBy: createdBy || null,
    };

    const options = session ? { session } : {};
    const [employee] = await Employee.create([employeeData], options);
    return employee;
  };

  if (callerSession) {
    return await executeProfileCreation(callerSession);
  }

  const session = await mongoose.startSession();
  try {
    let employee;
    await session.withTransaction(async () => {
      employee = await executeProfileCreation(session);
    });
    return employee;
  } finally {
    await session.endSession();
  }
};
