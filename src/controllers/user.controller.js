import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend/postman
  //validation - not empty
  //check if user alreade exist(username, email)
  //check for images, check for avatar
  //upload to cloudinary
  //create user object - create entry in db
  //remove password and Refresh Token field from response
  //check for user creation => return res if true

  //console.log("BODY DATA:", req.body);
  //console.log("FILES DATA:", req.files);

  const { fullName, email, username, password } = req.body;
  console.log("email: ", email);
  console.log("fullName: ", fullName);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    //field? (agar field hai) .trim() (trim kar dijiye) and still empty "" return true

    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email or password!");
  }

  console.log(req.files);

  // 1. Get the path from Multer (Log shows this exists!)
  const avatarLocalPath = req.files?.avatar?.[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // 2. Extra log to be 100% sure we are passing the right string
  console.log("PATH BEING SENT TO CLOUDINARY: ", avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing in request");
  }

  // 3. UPLOAD TO CLOUDINARY
  // Ensure you use 'avatarLocalPath' (Capital P) to match exactly
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // 4. CHECK IF CLOUDINARY RETURNED THE URL
  if (!avatar) {
    throw new ApiError(400, "Cloudinary upload failed! Check your .env keys.");
  }

  //database me entry
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", //safety measure
    password,
    email,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User register successfully!"));
});

export { registerUser };
