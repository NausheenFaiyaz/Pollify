import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    sub: { type: String, required: true, unique: true, index: true },
    email: { type: String, trim: true, default: "" },
    name: { type: String, trim: true, default: "" },
    picture: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
