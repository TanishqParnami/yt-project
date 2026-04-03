import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    throw new ApiError(400, "Playlist name is required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
    videos: [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "New playlist created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $match: { isPublished: true },
          },
          {
            $project: {
              title: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalVideos: { $size: "$videos" },
        thumbmnail: { $first: "$videos.thumbnail" },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        totalVideos: 1,
        thumbmnail: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $sort: { updatedAt: -1 },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      //videos inside the playlist
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $match: {
              isPublished: true, //only published videos
            },
          },
          {
            //video owners
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: { owner: { $first: "$owner" } }, //array to object
          },
          {
            $project: {
              //video projections
              title: 1,
              description: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
              owner: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      //user/owner of playlist
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ project: { username: 1, fullName: 1, avatar: 1 } }],
      },
    },
    {
      $addFields: {
        onwer: { $first: "$owner" },
        totalVideos: { $size: "$videos" },
        totalDuration: {
          $ifNull: [{ $sum: "$videos.duration" }, 0],
        },
      },
    },
  ]);

  if (!playlist?.length) {
    throw new ApiError(404, "Playlist not found");
  }

  const result = playlist[0];

  if (
    !result.isPublic &&
    result.owner._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "You are not authorized to view this playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  //check if video already present or not
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(409, "Video already exists in the playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, updatedPlaylist));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized request");
  }

  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(404, "Video not found in the playlist");
  }

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: new mongoose.Types.ObjectId(videoId) } },
    { new: true }
  );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  if (name === undefined && description === undefined) {
    throw new ApiError(
      400,
      "At least one field (name or description) is required"
    );
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this playlist");
  }

  if (name !== undefined) {
    if (name.trim() === "") {
      throw new ApiError(400, "Name cannot be empty");
    }
    playlist.name = name.trim();
  }
  if (description !== undefined) {
    playlist.description = description.trim();
  }

  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id) {
    throw new ApiError(403, "Unauthorized request");
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  addVideoToPlaylist,
  deletePlaylist,
  getPlaylistById,
  updatePlaylist,
  removeVideoFromPlaylist,
};
