import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

dotenv.config();

const seedAdmin = async () => {
  if (!process.env.MONGO_URL) {
    console.error("MONGO_URL environment variable is not defined.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URL);

    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      console.log("An Admin account already exists.");
      mongoose.connection.close();
      return;
    }

    const name = process.env.ADMIN_NAME || "Super Admin";
    const email = process.env.ADMIN_EMAIL || "admin@hrms.com";
    const password = process.env.ADMIN_PASSWORD || "admin123";

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    await user.save();

    const adminProfile = new Admin({
      user: user._id,
    });

    await adminProfile.save();

    console.log(`Admin user and profile created successfully: ${email}`);
  } catch (error) {
    console.error("Failed to seed admin user:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();
