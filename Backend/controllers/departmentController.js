import Department from "../models/Department.js";

export const createDepartment = async (req, res) => {
  const { name } = req.body;

  try {
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: "Department already exists with this name",
      });
    }

    const department = new Department({ name });
    await department.save();

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    
    return res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
