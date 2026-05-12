import mongoose, { Schema } from "mongoose";

const answerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    optionIndex: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const responseSchema = new Schema(
  {
    poll: { type: Schema.Types.ObjectId, ref: "Poll", required: true, index: true },
    responderSub: { type: String, index: true },
    anonymousSessionId: { type: String, index: true },
    isAnonymous: { type: Boolean, default: false },
    answers: { type: [answerSchema], required: true },
  },
  { timestamps: true }
);

responseSchema.index({ poll: 1, responderSub: 1 }, { unique: true, partialFilterExpression: { responderSub: { $exists: true } } });
responseSchema.index(
  { poll: 1, anonymousSessionId: 1 },
  { unique: true, partialFilterExpression: { anonymousSessionId: { $exists: true } } }
);

export const ResponseModel = mongoose.model("Response", responseSchema);
