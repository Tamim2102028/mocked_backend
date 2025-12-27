import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getUserProfilePostsService } from "../services/profile.service.js";

// =========================
// 🚀 GET USER PROFILE POSTS (By Username)
// =========================
const getUserProfilePosts = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const data = await getUserProfilePostsService(
    username,
    req.user?._id,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, data, "User posts fetched successfully"));
});

export { getUserProfilePosts };
