import { isValidObjectId, mongoose } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel ID not valid");
  }

  if (channelId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to yourself");
  }

  const alreadySubscribed = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (alreadySubscribed) {
    await alreadySubscribed.deleteOne();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subscribed: false },
          "Account unsubscribed successfully"
        )
      );
  }

  await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscribed: true },
        "Account subscribed successfully"
      )
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  let { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel ID not valid");
  }

  page = Number(page);
  limit = Number(limit);

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    { $unwind: "$subscriber" },

    {
      $project: {
        _id: "$subscriber._id",
        username: "$subscriber.username",
        email: "$subscriber.email",
        subscribedAt: "$createdAt",
      },
    },

    { $sort: { subscribedAt: -1 } },

    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSubscribers,
        page,
        totalPages: Math.ceil(totalSubscribers / limit),
        subscribers,
      },
      "Channel subscribers fetched successfully"
    )
  );
});

const getSubscribedChannel = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let { page = 1, limit = 10 } = req.query;

  page = Number(page);
  limit = Number(limit);

  const totalSubscribed = await Subscription.countDocuments({
    subsriber: userId,
  });

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(userId),
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
      },
    },
    { $unwind: "$channel" },
    {
      $project: {
        _id: "$channel._id",
        username: "$channel.username",
        subscribedAt: "$createdAt",
      },
    },

    { $sort: { subscribedAt: -1 } },

    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  

  return res.status(200).json(
    new ApiResponse(200, {
      totalSubscribed,
      subscribedChannels,
      page,
      totalPages: Math.ceil(totalSubscribed / limit),
    }),
    "Subscribed channels fetched successfully"
  );
});

const isSubscribed = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid channel ID",
    });
  }

  const isSubscribed = await Subscription.exists({
    channel: channelId,
    subscriber: req.user._id,
  });

  return res.status(200).json({
    success: true,
    isSubscribed: !!isSubscribed,
  });
});

export {
  toggleSubscription,
  getSubscribedChannel,
  getUserChannelSubscribers,
  isSubscribed,
};
