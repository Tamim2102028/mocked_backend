import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  getPostCommentsService,
  addCommentService,
  deleteCommentService,
  updateCommentService,
  toggleCommentLikeService,
} from "../services/comment.service.js";

// 🚀 1. GET COMMENTS BY POST ID (With Pagination & Soft Delete check)
const getPostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const result = await getPostCommentsService(
    postId,
    page,
    limit,
    req.user._id
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comments fetched successfully"));
});

// 🚀 2. ADD COMMENT
const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const result = await addCommentService(postId, content, req.user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Comment added successfully"));
});

// 🚀 3. DELETE COMMENT (Soft Delete)
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const result = await deleteCommentService(commentId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment deleted successfully"));
});

// 🚀 4. UPDATE COMMENT
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Content is required");
  }

  const result = await updateCommentService(commentId, content, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment updated successfully"));
});

// 🚀 5. TOGGLE COMMENT LIKE
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const result = await toggleCommentLikeService(commentId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment like toggled"));
});

export {
  getPostComments,
  addComment,
  deleteComment,
  updateComment,
  toggleCommentLike,
};
