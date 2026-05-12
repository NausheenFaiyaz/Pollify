import { Router } from "express";
import {
  createPoll,
  getPollAnalytics,
  getPublicPoll,
  listMyPolls,
  publishPoll,
  submitPollResponse,
} from "../controllers/poll.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, asyncHandler(createPoll));
router.get("/mine", requireAuth, asyncHandler(listMyPolls));
router.get("/:slug/analytics", requireAuth, asyncHandler(getPollAnalytics));
router.patch("/:slug/publish", requireAuth, asyncHandler(publishPoll));

router.get("/public/:slug", optionalAuth, asyncHandler(getPublicPoll));
router.post("/public/:slug/respond", optionalAuth, asyncHandler(submitPollResponse));

export default router;
