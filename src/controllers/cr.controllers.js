import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { POST_TARGET_MODELS, POST_TYPES } from "../constants/index.js";
import { getCrFeedService } from "../services/academic.service.js";
import {
  createPostService,
  toggleLikePostService,
  toggleMarkAsReadService,
  deletePostService,
  updatePostService,
} from "../services/post.service.js";
import {
  getPostCommentsService,
  addCommentService,
  deleteCommentService,
  updateCommentService,
  toggleCommentLikeService,
} from "../services/comment.service.js";

// 🚀 1. GET CR FEED
const getCrFeed = asyncHandler(async (req, res) => {
  // CR Corner might be based on department or section, usually passed or inferred from user context
  // Assuming for now it's fetched based on a 'crCornerId' or similar, or just user's department
  // But the previous implementation used `postOnId: "section_a"` hardcoded.
  // I'll assume we pass `crCornerId` or `deptId` in params or query, or infer from user.
  // However, the previous controller didn't take any params for getCrFeed.
  // I'll assume the user wants to see their CR corner feed.
  // Let's use user's department/section as the ID if not provided.
  // But wait, `getCrFeedService` takes `crCornerId`.
  // Let's check the previous `getCrFeed` implementation again.
  // It hardcoded `postOnId: "section_a"`.
  // I'll stick to a placeholder or try to get it from request.
  // Since I don't have the full context of how CR corner is structured, I'll assume `req.params.crCornerId` or fall back to user's dept.
  // But to be safe and compatible with previous code which took no params, I'll check if I can get it from user.

  const crCornerId = req.user.academicInfo?.department || "section_a"; // Fallback to what was there implicitly
  const { page = 1, limit = 10 } = req.query;

  const { posts, pagination } = await getCrFeedService(
    crCornerId,
    req.user._id,
    page,
    limit
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, { posts, pagination }, "CR Corner feed fetched")
    );
});

// 🚀 2. CREATE CR NOTICE
const createCrPost = asyncHandler(async (req, res) => {
  const { content } = req.body;

  // Previous implementation: postOnId: req.user.academicInfo?.department || "dept_id"
  const crCornerId = req.user.academicInfo?.department || "section_a";

  const postData = {
    content,
    type: POST_TYPES.NOTICE, // CR posts are notices
    postOnModel: POST_TARGET_MODELS.CR_CORNER,
    postOnId: crCornerId,
    ...req.body,
  };

  const { post, meta } = await createPostService(postData, req.user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, { post, meta }, "Notice posted in CR Corner"));
});

// ==========================================
// 🚀 POST & COMMENT ACTIONS (Shared Logic)
// ==========================================

// 🚀 TOGGLE LIKE CR POST
const toggleCrPostLike = asyncHandler(async (req, res) => {
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

// 🚀 TOGGLE MARK AS READ
const toggleCrPostRead = asyncHandler(async (req, res) => {
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

// 🚀 DELETE CR POST
const deleteCrPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const result = await deletePostService(postId, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Post deleted successfully"));
});

// 🚀 UPDATE CR POST
const updateCrPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const updatedPost = await updatePostService(postId, req.user._id, req.body);
  return res
    .status(200)
    .json(new ApiResponse(200, updatedPost, "Post updated successfully"));
});

// 🚀 GET POST COMMENTS
const getCrPostComments = asyncHandler(async (req, res) => {
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

// 🚀 ADD COMMENT
const createCrPostComment = asyncHandler(async (req, res) => {
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

// 🚀 DELETE COMMENT
const deleteCrPostComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const result = await deleteCommentService(commentId, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment deleted successfully"));
});

// 🚀 UPDATE COMMENT
const updateCrPostComment = asyncHandler(async (req, res) => {
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

// 🚀 TOGGLE COMMENT LIKE
const toggleCrPostCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const result = await toggleCommentLikeService(commentId, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment like toggled"));
});

export {
  getCrFeed,
  createCrPost,
  toggleCrPostLike,
  toggleCrPostRead,
  deleteCrPost,
  updateCrPost,
  getCrPostComments,
  createCrPostComment,
  deleteCrPostComment,
  updateCrPostComment,
  toggleCrPostCommentLike,
};
