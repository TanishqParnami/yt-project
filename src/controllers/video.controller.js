import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteCloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  page = Number(page);
  limit = Number(limit);

  const match = {
    isPublished: true,
  };

  if (query) {
    match.title = { $regex: query, $options: "i" };
  }

  if (userId && isValidObjectId(userId)) {
    match.owner = new mongoose.Types.ObjectId(userId);
  }

  const sortOptions = {
    [sortBy]: sortType === "asc" ? 1 : -1,
  };

  const video = await Video.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "onwer",
      },
    },
    { $unwind: "$owner" },

    {
      $project: {
        title: 1,
        description: 1,
        videoFile: 1,
        thumbnail: 1,
        views: 1,
        createdAt: 1,
        "owner.username": 1,
        "owner.email": 1,
      },
    },
    { $sort: sortOptions },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  const total = await Video.countDocuments(match);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        videos,
      },
      "Videos fetched successfully"
    )
  );
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description is required");
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  if (!thumbnailLocalPath.match(/\.(jpg|jpeg|png)$/i)) {
    throw new ApiError(400, "Thumbnail must be an image (jpg, jpeg, png)");
  }

  const videoUpload = await uploadOnCloudinary(videoLocalPath);
  const thumbnailUpload = await uploadOnCloudinary(videoLocalPath);

  if (!videoUpload?.url) {
    throw new ApiError(500, "Video file upload failed");
  }
  if (!thumbnailUpload?.url) {
    throw new ApiError(500, "Thumbnail uplaod failed");
  }

  const video = await Video.create({
    title: title.trim(),
    description: description,
    videoFile: videoUpload.url,
    thumbnail: thumbnailUpload.url,
    owner: req.user._id,

    videoPublicId: videoUpload.public_id,
    thumbnailPublicId: thumbnailUpload.public_id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoByID = asyncHandler(async (req, res) => {
  //fetch one video
  //include owner details
  //increment views
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "username email"
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  video.views += 1;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  let thumbnailUrl = video.thumbnail;

  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (thumbnailLocalPath) {
    if (!thumbnailLocalPath.match(/\.(jpg|jpeg|png)$/i)) {
      throw new ApiError(400, "Thumbnail must be an image");
    }

    const uploaded = await uploadOnCloudinary(thumbnailLocalPath);

    if (!uploaded?.url || !uploaded?.public_id) {
      throw new ApiError(500, "Thumbnnail upload failed");
    }
    if (video.thumbnailPublicId) {
      await deleteFromCloudinary(video.thumbnailPublicId, "image");
    }

    thumbnailUrl = uploaded.url;
    video.thumbnailPublicId = uploaded.public_id;
  }

  video.title = title?.trim() || video.title;
  video.description = description?.trim() || video.description;
  video.thumbnail = thumbnailUrl;

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  try {
    if (video.videoPublicId) {
      await deleteFromCloudinary(video.videoPublicId, "video");
    }
  } catch (err) {
    console.log("Cloudinary video delete failed");
  }

  try {
    if (video.thumbnailPublicId) {
      await deleteFromCloudinary(video.thumbnailPublicId, "image");
    }
  } catch (err) {
    console.log("Cloudinary image delete failed");
  }

  await video.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  video.isPublished = !video.isPublished;

  await video.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isPublished: video.isPublished,
      },
      "Publish status toggled successfully"
    )
  );
});

export { publishVideo, getVideoByID, updateVideo, deleteVideo, getAllVideos, togglePublishStatus };
