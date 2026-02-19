import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
      trim: true,
      index: true, //searching field enable karni hai to index ko true kardo
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //url <=> image //CLOUDINARY URL
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is necessary"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

//pre hook works as middleware
//before data is saved, after call
// ek kaam kardo => like password encrypt kardo
userSchema.pre("save", async function() { // Removed 'next' here
    if (!this.isModified("password")) return; // No return next()

    try {
        this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
        throw error; // Mongoose will catch this as the error
    }
});


userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (password) {
  return jwt.sign(
    {
        _id: this.id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
};
//REFRESH TOKEN HAS LESSER INFO
//ONLY _id FOR NOW

userSchema.methods.generateRefreshToken = async function (password) {
  return jwt.sign(
    {
        _id: this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
};

export const User = mongoose.model("User", userSchema);
