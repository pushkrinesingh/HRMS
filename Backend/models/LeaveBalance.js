import mongoose from "mongoose";

const leaveTypeBalanceSchema = new mongoose.Schema(
  {
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    used: {
      type: Number,
      default: 0,
      min: 0,
    },
    pending: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
    },
    casual: {
      type: leaveTypeBalanceSchema,
      default: () => ({ total: 12, used: 0, pending: 0 }),
    },
    sick: {
      type: leaveTypeBalanceSchema,
      default: () => ({ total: 12, used: 0, pending: 0 }),
    },
    earned: {
      type: leaveTypeBalanceSchema,
      default: () => ({ total: 15, used: 0, pending: 0 }),
    },
  },
  { timestamps: true, versionKey: false }
);

leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

/**
 * Helper function to compute available days (total - used - pending) for each leave type.
 */
export const formatLeaveBalanceWithAvailable = (balanceDoc) => {
  if (!balanceDoc) return null;

  const doc = balanceDoc.toObject ? balanceDoc.toObject() : balanceDoc;

  const computeAvailable = (typeObj) => {
    if (!typeObj) return { total: 0, used: 0, pending: 0, available: 0 };
    const available = Math.max(0, (typeObj.total || 0) - (typeObj.used || 0) - (typeObj.pending || 0));
    return {
      total: typeObj.total || 0,
      used: typeObj.used || 0,
      pending: typeObj.pending || 0,
      available,
    };
  };

  return {
    _id: doc._id,
    employee: doc.employee,
    year: doc.year,
    casual: computeAvailable(doc.casual),
    sick: computeAvailable(doc.sick),
    earned: computeAvailable(doc.earned),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);

export default LeaveBalance;
