import Employee from "../models/Employee.js";

export const createProfileForRole = async ({
  userId,
  department,
  designation,
  manager,
  joiningDate,
  salary,
  createdBy,
}) => {
  const exists = await Employee.findOne({ user: userId });
  if (exists) {
    const error = new Error("An employee record already exists for this user");
    error.status = 400;
    throw error;
  }

  const employee = new Employee({
    user: userId,
    department,
    designation,
    manager: manager || null,
    joiningDate,
    salary,
    createdBy: createdBy || null,
  });

  await employee.save();
  return employee;
};
