import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    designation: {
      type: String,
      trim: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
    },
    joiningDate: {
      type: Date,
    },
    salary: {
      basic: {
        type: Number,
      },
      hra: {
        type: Number,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
