import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getUserProfilePostsService } from "../services/profile.service.js";
import {
  updateAcademicProfileService,
  updateUserAvatarService,
  updateUserCoverImageService,
  updateAccountDetailsService,
  getUserProfileHeaderService,
  getUserDetailsService,
} from "../services/auth.service.js";
import {
  createPostService,
  toggleLikePostService,
  toggleMarkAsReadService,
  deletePostService,
  updatePostService,
} from "../services/common/post.service.js";

// -----------------------------
// Profile Posts
// -----------------------------
const getUserProfilePosts = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { posts, pagination } = await getUserProfilePostsService(
    username,
    req.user?._id,
    req.query
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { posts, pagination },
        "User posts fetched successfully"
      )
    );
});

const createProfilePost = asyncHandler(async (req, res) => {
  const { post, meta } = await createPostService(req.body, req.user._id);
  return res
    .status(201)
    .json(new ApiResponse(201, { post, meta }, "Post created successfully"));
});

const toggleProfilePostLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { isLiked } = await toggleLikePostService(postId, req.user._id);
  return res
    .status(200)
    .json(
      new ApiResponse(200, { isLiked }, isLiked ? "Post liked" : "Post unliked")
    );
});

const toggleProfilePostRead = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { isRead } = await toggleMarkAsReadService(postId, req.user._id);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isRead },
        isRead ? "Marked as read" : "Marked as unread"
      )
    );
});

const deleteProfilePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { postId: deletedPostId } = await deletePostService(
    postId,
    req.user._id
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { postId: deletedPostId },
        "Post deleted successfully"
      )
    );
});

const updateProfilePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { post, meta } = await updatePostService(
    postId,
    req.user._id,
    req.body
  );
  return res
    .status(200)
    .json(new ApiResponse(200, { post, meta }, "Post updated successfully"));
});

// -----------------------------
// Post Comments
// -----------------------------
// (Moved to dedicated controllers)

// -----------------------------
// Profile Updates / Onboarding (moved)
// -----------------------------
const updateAcademicProfile = asyncHandler(async (req, res) => {
  const { user } = await updateAcademicProfileService(
    req.user._id,
    req.user.userType,
    req.body
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, { user }, "Academic profile updated successfully")
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  const { avatarUrl } = await updateUserAvatarService(
    req.user._id,
    avatarLocalPath
  );
  return res
    .status(200)
    .json(new ApiResponse(200, { avatarUrl }, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  const { coverImageUrl } = await updateUserCoverImageService(
    req.user._id,
    coverImageLocalPath
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { coverImageUrl },
        "Cover image updated successfully"
      )
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { user } = await updateAccountDetailsService(req.user._id, req.body);
  return res
    .status(200)
    .json(
      new ApiResponse(200, { user }, "Account details updated successfully")
    );
});

// -----------------------------
// Public Profile Views (moved)
// -----------------------------
const getUserProfileHeader = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { user, meta } = await getUserProfileHeaderService(
    username,
    req.user?._id
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, { user, meta }, "User profile fetched successfully")
    );
});

const getUserDetails = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { user } = await getUserDetailsService(username);
  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User details fetched successfully"));
});

export {
  getUserProfilePosts,
  createProfilePost,
  toggleProfilePostLike,
  toggleProfilePostRead,
  deleteProfilePost,
  updateProfilePost,
  updateAcademicProfile,
  updateUserAvatar,
  updateUserCoverImage,
  updateAccountDetails,
  getUserProfileHeader,
  getUserDetails,
};
