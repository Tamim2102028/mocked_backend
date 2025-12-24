import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Follow } from "../models/follow.model.js";
import { User } from "../models/user.model.js";
import { FOLLOW_TARGET_MODELS } from "../constants/index.js";

// ==============================================================================
// 1. FOLLOW USER
// ==============================================================================
const followUser = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.user._id;

  if (targetUserId === currentUserId.toString()) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  // ✅ Check if target user exists
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  const existingFollow = await Follow.findOne({
    follower: currentUserId,
    following: targetUserId,
    followingModel: FOLLOW_TARGET_MODELS.USER,
  });

  if (existingFollow) {
    throw new ApiError(400, "You are already following this user");
  }

  await Follow.create({
    follower: currentUserId,
    following: targetUserId,
    followingModel: FOLLOW_TARGET_MODELS.USER,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { isFollowing: true }, "User followed successfully")
    );
});

// ==============================================================================
// 2. UNFOLLOW USER
// ==============================================================================
const unfollowUser = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.user._id;

  const follow = await Follow.findOneAndDelete({
    follower: currentUserId,
    following: targetUserId,
    followingModel: FOLLOW_TARGET_MODELS.USER,
  });

  if (!follow) {
    throw new ApiError(400, "You are not following this user");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isFollowing: false },
        "User unfollowed successfully"
      )
    );
});

export { followUser, unfollowUser };
