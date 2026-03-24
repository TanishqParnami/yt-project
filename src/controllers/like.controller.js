import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose, { isValidObjectId } from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const existingLike = await Like.findOne({
    user: req.user._id,
    video: videoId,
  });

  if (existingLike) {
    await existingLike.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, { liked: false }, "Unliked video"));
  }

  await Like.create({
    user: req.user._id,
    video: videoId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { liked: true }, "Liked video"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const existingLike = await Like.findOne({
    likedBy: req.user._id,
    comment: commentId,
  });

  if (existingLike) {
    await existingLike.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, { liked: false }, "Comment unliked"));
  }

  await Like.create({
    likedBy: req.user._id,
    comment: commentId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { liked: true }, "Comment liked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const { userId } = req.user._id;

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $unwind: "$video",
    },
    {
      $lookup: {
        from: "users",
        localField: "video.owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    {
      $project: {
        _id: "$video._id",
        title: "$video.title",
        videoFile: "$video.videoFile",
        thumbnail: "$video.thumbnail",
        views: "$video.views",
        createdAt: "$video.createdAt",
        "owner.username": 1,
        "owner.email": 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked video fetched successfully")
    );
});

export { toggleCommentLike, toggleVideoLike, getLikedVideos };
