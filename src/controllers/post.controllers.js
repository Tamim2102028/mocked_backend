// ==========================================
// post.controller.js
// ==========================================
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createPostService,
  toggleLikePostService,
  toggleMarkAsReadService,
  deletePostService,
  updatePostService,
} from "../services/post.service.js";

// =========================
// 🚀 1. CREATE POST
// =========================
const createPost = asyncHandler(async (req, res) => {
  const formattedPost = await createPostService(req.body, req.user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, formattedPost, "Post created successfully"));
});

// =========================
// 🚀 2. GET FEED POSTS
// =========================
const getFeedPosts = asyncHandler(async (req, res) => {
  // feed post er logic pore lekha hobe , age onno jaigar post er logic lekhe ses kori.
});

// =========================
// 🚀 3. TOGGLE LIKE POST
// =========================
const toggleLikePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const result = await toggleLikePostService(postId, req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.isLiked ? "Post liked" : "Post unliked"
      )
    );
});

// =========================
// 🚀 4. TOGGLE MARK AS READ
// =========================
const toggleMarkAsRead = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const result = await toggleMarkAsReadService(postId, req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.isRead ? "Marked as read" : "Marked as unread"
      )
    );
});

// =========================
// 🚀 6. DELETE POST (Soft Delete)
// =========================
const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const result = await deletePostService(postId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Post deleted successfully"));
});

// =========================
// 🚀 7. UPDATE POST
// =========================
const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const updatedPost = await updatePostService(postId, req.user._id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPost, "Post updated successfully"));
});

export {
  createPost,
  getFeedPosts,
  toggleLikePost,
  toggleMarkAsRead,
  deletePost,
  updatePost,
};
