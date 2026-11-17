import mongoose from "mongoose";

const salaryStructureSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
      unique: true,
    },
    basic: {
      type: Number,
      required: [true, "Basic salary is required"],
      min: [0, "Basic salary cannot be negative"],
    },
    hra: {
      type: Number,
      required: [true, "HRA is required"],
      min: [0, "HRA cannot be negative"],
    },
    allowances: {
      type: Number,
      default: 0,
      min: [0, "Allowances cannot be negative"],
    },
    pfPercent: {
      type: Number,
      default: 12,
      min: [0, "PF percentage cannot be negative"],
      max: [100, "PF percentage cannot exceed 100"],
    },
    taxPercent: {
      type: Number,
      default: 10,
      min: [0, "Tax percentage cannot be negative"],
      max: [100, "Tax percentage cannot exceed 100"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

const SalaryStructure = mongoose.model("SalaryStructure", salaryStructureSchema);

export default SalaryStructure;
