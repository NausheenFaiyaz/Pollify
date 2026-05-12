import { Types } from "mongoose";
import { Poll } from "../models/Poll.js";
import { ResponseModel } from "../models/Response.js";

export const buildPollAnalytics = async (pollId: Types.ObjectId) => {
  const poll = await Poll.findById(pollId).lean();
  if (!poll) return null;

  const responses = await ResponseModel.find({ poll: pollId }).lean();
  const totalResponses = responses.length;

  const questionSummary = poll.questions.map((q) => {
    const counts = Array.from({ length: q.options.length }, () => 0);
    for (const r of responses) {
      const hit = r.answers.find((a) => a.questionId.toString() === q._id.toString());
      if (hit && hit.optionIndex >= 0 && hit.optionIndex < counts.length) {
        counts[hit.optionIndex] += 1;
      }
    }

    return {
      questionId: q._id,
      prompt: q.prompt,
      required: q.required,
      options: q.options.map((o, idx) => ({ label: o.label, count: counts[idx] ?? 0 })),
    };
  });

  return {
    poll: {
      id: poll._id,
      slug: poll.slug,
      title: poll.title,
      responseMode: poll.responseMode,
      isPublished: poll.isPublished,
      expiresAt: poll.expiresAt,
      totalQuestions: poll.questions.length,
    },
    participation: {
      totalResponses,
      anonymousResponses: responses.filter((r) => r.isAnonymous).length,
      authenticatedResponses: responses.filter((r) => !r.isAnonymous).length,
    },
    questionSummary,
  };
};
