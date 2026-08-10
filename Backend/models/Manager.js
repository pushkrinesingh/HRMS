import mongoose from "mongoose";

const managerSchema = new mongoose.Schema(
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

const Manager = mongoose.model("Manager", managerSchema);

export default Manager;
