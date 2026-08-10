import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
