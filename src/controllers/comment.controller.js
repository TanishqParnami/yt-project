import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Comment } from "../models/comment.model";
import { ApiResponse } from "../utils/ApiResponse";
import { Video } from "../models/video.model";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  let { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  page = Number(page);
  limit = Number(limit);

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },

    //user details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" },

    //clean response
    {
      $project: {
        content: 1,
        createdAt: 1,
        "owner.username": 1,
        "owner.email": 1,
      },
    },

    { $sort: { createdAt: -1 } },

    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  const total = await Comment.countDocuments({
    video: videoId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        page,
        comments,
        totalPages: Math.ceil(total / limit),
      },
      "Comments fetched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const {content} = req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID");
    }

    if(!content?.trim()){
        throw new ApiError(400, "Comment content is required");
    }

    const commment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;

    if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const comment = await Comment.findById(commentId);

  if(!comment){
    throw new ApiError(404, "Comment not found")
  }

  if(comment.onwer.toString() !== req.user._id.toString()){
    throw new ApiError(403, "Unauthorized")
  }

  comment.content = content.trim();
  await comment.save();

  return res
  .status(200)
  .json(
    new ApiResponse(200, comment, " Comment has been updated")
  )
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commmentId} = req.params;

    if(!isValidObjectId(commmentId)){
        throw new ApiError(400, "Invalid Comment ID")
    }

    const comment = await Comment.findById(commmentId);

    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    const video = Video.findById(comment.video);

    const isCommentOwner = comment.onwer.toString() === req.user._id.toString();
    const isVideoOwner = video?.onwer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if(!isAdmin && !isCommentOwner && !isVideoOwner){
        throw new ApiError(403, "Unauthorized request")
    }

    await comment.deleteOne();

    return res
    .status(200)
    .json(
        new ApiResponse(200, {commmentId}, "Comment deleted successfully")
    )

})

export {getVideoComments, addComment, deleteComment}