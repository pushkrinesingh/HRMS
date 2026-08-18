import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

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
      await mongoose.connection.close();
      return;
    }

    const name = process.env.ADMIN_NAME || "Super Admin";
    const email = process.env.ADMIN_EMAIL || "admin@hrms.com";
    const password = process.env.ADMIN_PASSWORD || "admin123";

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const [user] = await User.create(
          [
            {
              name,
              email,
              password,
              role: "admin",
            },
          ],
          { session }
        );

        await Employee.create(
          [
            {
              user: user._id,
              role: "admin",
              designation: "System Administrator",
              joiningDate: new Date(),
              manager: null,
            },
          ],
          { session }
        );
      });

      console.log(`Admin user and employee profile created successfully: ${email}`);
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error("Failed to seed admin user:", error);
  } finally {
    await mongoose.connection.close();
  }
};

seedAdmin();
