import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
    },
    leaveType: {
      type: String,
      enum: {
        values: ["Casual", "Sick", "Earned", "LWP"],
        message: "{VALUE} is not a valid leave type",
      },
      required: [true, "Leave type is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "End date cannot be earlier than start date",
      },
    },
    numberOfDays: {
      type: Number,
      required: [true, "Number of days is required"],
      min: [1, "Number of days must be at least 1"],
    },
    reason: {
      type: String,
      trim: true,
      required: [true, "Reason for leave is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "{VALUE} is not a valid leave status",
      },
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    approverComment: {
      type: String,
      trim: true,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, versionKey: false }
);

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
