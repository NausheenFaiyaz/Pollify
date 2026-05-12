import mongoose from "mongoose";

export const connectDB = async (mongoUri: string) => {
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};
