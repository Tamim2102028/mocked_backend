import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getUserProfilePostsService } from "../services/profile.service.js";
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

// =========================
// 🚀 GET USER PROFILE POSTS (By Username)
// =========================
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

// =========================
// 🚀 CREATE PROFILE POST
// =========================
const createProfilePost = asyncHandler(async (req, res) => {
  const { post, meta } = await createPostService(req.body, req.user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, { post, meta }, "Post created successfully"));
});

// =========================
// 🚀 TOGGLE LIKE PROFILE POST
// =========================
const toggleProfilePostLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const { isLiked } = await toggleLikePostService(postId, req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { isLiked }, isLiked ? "Post liked" : "Post unliked")
    );
});

// =========================
// 🚀 TOGGLE MARK AS READ
// =========================
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

// =========================
// 🚀 DELETE PROFILE POST
// =========================
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

// =========================
// 🚀 UPDATE PROFILE POST
// =========================
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

// =========================
// 🚀 GET POST COMMENTS
// =========================
const getProfilePostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const { comments, pagination } = await getPostCommentsService(
    postId,
    page,
    limit,
    req.user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { comments, pagination },
        "Comments fetched successfully"
      )
    );
});

// =========================
// 🚀 ADD COMMENT
// =========================
const createProfilePostComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const { comment, meta } = await addCommentService(
    postId,
    content,
    req.user._id
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, { comment, meta }, "Comment added successfully")
    );
});

// =========================
// 🚀 DELETE COMMENT
// =========================
const deleteProfilePostComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const { commentId: deletedCommentId } = await deleteCommentService(
    commentId,
    req.user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { commentId: deletedCommentId },
        "Comment deleted successfully"
      )
    );
});

// =========================
// 🚀 UPDATE COMMENT
// =========================
const updateProfilePostComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Content is required");
  }

  const { comment, meta } = await updateCommentService(
    commentId,
    content,
    req.user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, { comment, meta }, "Comment updated successfully")
    );
});

// =========================
// 🚀 TOGGLE COMMENT LIKE
// =========================
const toggleProfilePostCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const { isLiked } = await toggleCommentLikeService(commentId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked }, "Comment like toggled"));
});

export {
  getUserProfilePosts,
  createProfilePost,
  toggleProfilePostLike,
  toggleProfilePostRead,
  deleteProfilePost,
  updateProfilePost,
  getProfilePostComments,
  createProfilePostComment,
  deleteProfilePostComment,
  updateProfilePostComment,
  toggleProfilePostCommentLike,
};
