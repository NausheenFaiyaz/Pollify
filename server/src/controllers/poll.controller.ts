import crypto from "crypto";
import { z } from "zod";
import { Types } from "mongoose";
import { Poll } from "../models/Poll.js";
import { ResponseModel } from "../models/Response.js";
import { buildPollAnalytics } from "../services/analytics.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { emitAnalyticsUpdate } from "../socket/socketHandler.js";
import { type Request, type Response } from "express";

const createPollSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().max(1000).optional().default(""),
  responseMode: z.enum(["anonymous", "authenticated", "both"]),
  expiresAt: z.string().datetime(),
  questions: z.array(
    z.object({
      prompt: z.string().min(3).max(300),
      required: z.boolean().default(true),
      options: z.array(z.object({ label: z.string().min(1).max(120) })).min(2).max(10),
    })
  ).min(1).max(30),
});

const submitResponseSchema = z.object({
  anonymousSessionId: z.string().min(8).max(128).optional(),
  answers: z.array(z.object({ questionId: z.string(), optionIndex: z.number().int().nonnegative() })),
});

const makeSlug = () => crypto.randomBytes(4).toString("hex");

export const createPoll = async (req: Request, res: Response) => {
  if (!req.auth?.sub) throw ApiError.unauthorized();

  const parsed = createPollSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest("Invalid poll payload", parsed.error.issues);
  }

  const expiresAt = new Date(parsed.data.expiresAt);
  if (expiresAt <= new Date()) {
    throw ApiError.badRequest("Expiry must be in the future");
  }

  const poll = await Poll.create({ ...parsed.data, expiresAt, slug: makeSlug(), createdBy: req.auth.sub });
  return ApiResponse.created(res, "Poll created", { poll });
};

export const listMyPolls = async (req: Request, res: Response) => {
  const polls = await Poll.find({ createdBy: req.auth?.sub }).sort({ createdAt: -1 }).lean();
  return ApiResponse.ok(res, "My polls", { polls });
};

export const getPublicPoll = async (req: Request, res: Response) => {
  const poll = await Poll.findOne({ slug: req.params.slug }).lean();
  if (!poll) throw ApiError.notFound("Poll not found");

  const isExpired = new Date() > poll.expiresAt;
  const isCreator = req.auth?.sub === poll.createdBy;
  const showResults = poll.isPublished || (isExpired && isCreator);

  const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId : undefined;
  let existingResponse: { answers: Array<{ questionId: string; optionIndex: number }> } | null = null;

  if (req.auth?.sub) {
    const response = await ResponseModel.findOne({ poll: poll._id, responderSub: req.auth.sub }).lean();
    if (response) {
      existingResponse = {
        answers: response.answers.map((a) => ({ questionId: a.questionId.toString(), optionIndex: a.optionIndex })),
      };
    }
  } else if (sessionId) {
    const response = await ResponseModel.findOne({ poll: poll._id, anonymousSessionId: sessionId }).lean();
    if (response) {
      existingResponse = {
        answers: response.answers.map((a) => ({ questionId: a.questionId.toString(), optionIndex: a.optionIndex })),
      };
    }
  }

  if (showResults) {
    const analytics = await buildPollAnalytics(poll._id as Types.ObjectId);
    return ApiResponse.ok(res, poll.isPublished ? "Published poll" : "Creator expired view", {
      poll,
      analytics,
      isExpired,
      showResults,
      existingResponse,
    });
  }

  return ApiResponse.ok(res, "Poll details", { poll, isExpired, showResults: false, existingResponse });
};

export const submitPollResponse = async (req: Request, res: Response) => {
  const poll = await Poll.findOne({ slug: req.params.slug });
  if (!poll) throw ApiError.notFound("Poll not found");
  if (new Date() > poll.expiresAt) throw ApiError.badRequest("Poll is expired");

  const parsed = submitResponseSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid response payload", parsed.error.issues);

  if (poll.responseMode === "authenticated" && !req.auth?.sub) {
    throw ApiError.unauthorized("Login required to respond to this poll");
  }

  if (poll.responseMode === "anonymous" && req.auth?.sub) {
    req.auth = undefined;
  }

  const answersByQuestion = new Map(parsed.data.answers.map((a) => [a.questionId, a.optionIndex]));

  for (const q of poll.questions) {
    const selected = answersByQuestion.get(q._id.toString());
    if (q.required && selected === undefined) {
      throw ApiError.badRequest(`Missing answer for required question: ${q.prompt}`);
    }
    if (selected !== undefined && (selected < 0 || selected >= q.options.length)) {
      throw ApiError.badRequest(`Invalid option selected for question: ${q.prompt}`);
    }
  }

  const isAnonymous = !req.auth?.sub;

  if (!isAnonymous) {
    const existingAuth = await ResponseModel.findOne({ poll: poll._id, responderSub: req.auth!.sub });
    if (existingAuth) throw ApiError.conflict("You have already responded to this poll");
  } else if (parsed.data.anonymousSessionId) {
    const existingAnon = await ResponseModel.findOne({ poll: poll._id, anonymousSessionId: parsed.data.anonymousSessionId });
    if (existingAnon) throw ApiError.conflict("You have already responded to this poll from this browser/session");
  }

  const answers = parsed.data.answers.map((a) => ({ questionId: new Types.ObjectId(a.questionId), optionIndex: a.optionIndex }));

  await ResponseModel.create({
    poll: poll._id,
    responderSub: req.auth?.sub,
    anonymousSessionId: parsed.data.anonymousSessionId,
    isAnonymous,
    answers,
  });

  const analytics = await buildPollAnalytics(poll._id as Types.ObjectId);
  if (analytics) emitAnalyticsUpdate(poll.slug, analytics);

  return ApiResponse.created(res, "Response submitted");
};

export const getPollAnalytics = async (req: Request, res: Response) => {
  const poll = await Poll.findOne({ slug: req.params.slug });
  if (!poll) throw ApiError.notFound("Poll not found");
  if (poll.createdBy !== req.auth?.sub) throw ApiError.forbidden("You are not owner of this poll");

  const analytics = await buildPollAnalytics(poll._id as Types.ObjectId);
  return ApiResponse.ok(res, "Poll analytics", { analytics });
};

export const publishPoll = async (req: Request, res: Response) => {
  const poll = await Poll.findOne({ slug: req.params.slug });
  if (!poll) throw ApiError.notFound("Poll not found");
  if (poll.createdBy !== req.auth?.sub) throw ApiError.forbidden("You are not owner of this poll");

  poll.isPublished = true;
  await poll.save();

  const analytics = await buildPollAnalytics(poll._id as Types.ObjectId);
  if (analytics) emitAnalyticsUpdate(poll.slug, analytics);

  return ApiResponse.ok(res, "Poll published", { poll });
};
