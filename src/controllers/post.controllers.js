// ==========================================
// post.controller.js
// ==========================================
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createPostService,
  toggleLikePostService,
  addCommentService,
  toggleMarkAsReadService,
  getUserProfilePostsService,
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
    .json(
      new ApiResponse(201, { post: formattedPost }, "Post created successfully")
    );
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
// 🚀 4. ADD COMMENT
// =========================
const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  const comment = await addCommentService(postId, content, req.user);

  return res
    .status(201)
    .json(new ApiResponse(201, { comment }, "Comment added"));
});

// =========================
// 🚀 5. TOGGLE MARK AS READ
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
// 🚀 6. GET USER PROFILE POSTS (By Username)
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

// =========================
// 🚀 7. DELETE POST (Soft Delete)
// =========================
const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const result = await deletePostService(postId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Post deleted successfully"));
});

// =========================
// 🚀 8. UPDATE POST
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
  addComment,
  toggleMarkAsRead,
  getUserProfilePosts,
  deletePost,
  updatePost,
};
