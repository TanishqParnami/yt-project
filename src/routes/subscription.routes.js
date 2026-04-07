import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannel,
  isSubscribed,
} from "../controllers/subscriber.controller.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/c/:channelId")
  .post(toggleSubscription)
  .get(getUserChannelSubscribers);

router.route("/u/:userId").get(getSubscribedChannel);
router.route("/c/:channelId/is-subscribed").get(isSubscribed);

export default router;
