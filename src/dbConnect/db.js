import mongoose from "mongoose";
import { DB_NAME } from "../constants/constants.js";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DATABASE_URI}/${DB_NAME}`,
      {
        // Removed deprecated options
      }
    );
    console.log(`MongoDB Connected: ${connectionInstance.connection.host}`);
  } catch (e) {
    console.log("Error: ", e);
    process.exit(1);
  }
};

export default connectDB;