import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      index: true,
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likeSchema);
