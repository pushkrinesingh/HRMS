import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
    },
    month: {
      type: Number,
      required: [true, "Month is required"],
      min: [1, "Month must be between 1 and 12"],
      max: [12, "Month must be between 1 and 12"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [2000, "Year must be valid"],
    },
    basic: {
      type: Number,
      required: [true, "Basic salary snapshot is required"],
      min: [0, "Basic salary cannot be negative"],
    },
    hra: {
      type: Number,
      required: [true, "HRA snapshot is required"],
      min: [0, "HRA cannot be negative"],
    },
    allowances: {
      type: Number,
      required: [true, "Allowances snapshot is required"],
      default: 0,
      min: [0, "Allowances cannot be negative"],
    },
    grossPay: {
      type: Number,
      required: [true, "Gross pay is required"],
      min: [0, "Gross pay cannot be negative"],
    },
    pfDeduction: {
      type: Number,
      required: [true, "PF deduction is required"],
      min: [0, "PF deduction cannot be negative"],
    },
    taxDeduction: {
      type: Number,
      required: [true, "Tax deduction is required"],
      min: [0, "Tax deduction cannot be negative"],
    },
    totalDeductions: {
      type: Number,
      required: [true, "Total deductions is required"],
      min: [0, "Total deductions cannot be negative"],
    },
    netPay: {
      type: Number,
      required: [true, "Net pay is required"],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

payslipSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

const Payslip = mongoose.model("Payslip", payslipSchema);

export default Payslip;
