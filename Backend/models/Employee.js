import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [
        function () {
          return this.role === "manager" || this.role === "employee";
        },
        "Department is required",
      ],
    },
    designation: {
      type: String,
      trim: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [
        function () {
          return this.role === "manager" || this.role === "employee";
        },
        "Manager is required",
      ],
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
