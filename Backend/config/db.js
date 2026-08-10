import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config();

async function ConnectToDB() {
    if (!process.env.MONGO_URL) {
        console.error("FATAL ERROR: MONGO_URL environment variable is not defined.");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Database Connected Successfully");

    } catch (error) {
        console.log("Cannot Connect To Database : ", error);
        process.exit(1);
    }
}

export default ConnectToDB;