import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const { channelId } = req.user?._id;

  if (!channelId) {
    throw new ApiError(401, "Unauthorized");
  }

  const videoStats = await Video.aggregate([
    {
      $match: {
        onwer: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  const likesStats = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoData",
      },
    },
    { $unwind: "$videoData" },
    {
      $match: {
        "videoData.owner": new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: 1 },
      },
    },
  ]);

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalLikes: likesStats[0]?.totalLikes || 0,
        totalSubscribers,
        totalViews: videoStats[0]?.totalViews || 0,
      },
      "Channel stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.user?._id;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Math.min(50, Number(limit)));

  const sortOrder = sortType === "asc" ? 1 : -1;

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $sort: {
        [sortBy]: sortOrder,
      },
    },
    {
      $skip: (pageNum - 1) * limitNum,
    },
    {
      $limit: limitNum,
    },
  ]);

  const totalVideos = await Video.countDocuments({
    owner: channelId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        totalVideos,
        page: pageNum,
        limit: limitNum,
      },
      "Channel videos fetched successfully"
    )
  );
});

export { getChannelStats, getChannelVideos };
