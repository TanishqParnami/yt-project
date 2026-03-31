import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { getSubscribedChannel, getUserChannelSubscribers, toggleSubscription, isSubscribed } from "../controllers/subscriber.controller";

const router = Router();

router.route("/c/:channelId").post(verifyJWT, toggleSubscription);

router.route("/c/:channelId/subscribers").get(getUserChannelSubscribers)

router.route("/u/:subsriberId").get(getSubscribedChannel);

router.route("/c/:channelId/is-subscribed").get(verifyJWT, isSubscribed);

export default router;