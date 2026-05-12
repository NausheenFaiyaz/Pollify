import mongoose, { Schema, type InferSchemaType } from "mongoose";

const optionSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const questionSchema = new Schema({
  prompt: { type: String, required: true, trim: true },
  required: { type: Boolean, default: true },
  options: {
    type: [optionSchema],
    validate: {
      validator: (v: { label: string }[]) => v.length >= 2,
      message: "Each question must have at least 2 options",
    },
  },
});

const pollSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    createdBy: { type: String, required: true, index: true },
    responseMode: {
      type: String,
      enum: ["anonymous", "authenticated", "both"],
      default: "both",
    },
    expiresAt: { type: Date, required: true, index: true },
    isPublished: { type: Boolean, default: false },
    questions: { type: [questionSchema], required: true },
  },
  { timestamps: true }
);

pollSchema.virtual("isActive").get(function (this: InferSchemaType<typeof pollSchema>) {
  return new Date() < this.expiresAt;
});

export type PollDocument = InferSchemaType<typeof pollSchema> & { _id: mongoose.Types.ObjectId };

export const Poll = mongoose.model("Poll", pollSchema);
