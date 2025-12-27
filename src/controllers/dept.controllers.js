import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { POST_TARGET_MODELS, POST_TYPES } from "../constants/index.js";
import { getDeptFeedService } from "../services/academic.service.js";
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

// 🚀 1. GET DEPT FEED
const getDeptFeed = asyncHandler(async (req, res) => {
  const { deptId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const result = await getDeptFeedService(deptId, req.user._id, page, limit);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Dept feed fetched"));
});

// 🚀 2. CREATE DEPT POST (Only for Admin/Head)
const createDeptPost = asyncHandler(async (req, res) => {
  const { deptId } = req.params;
  const { content } = req.body;

  // Prepare post data for generic service
  const postData = {
    content,
    type: POST_TYPES.NOTICE, // Default to NOTICE for dept posts
    postOnModel: POST_TARGET_MODELS.DEPARTMENT,
    postOnId: deptId,
    // Add other fields if necessary, e.g., attachments
    ...req.body,
  };

  const formattedPost = await createPostService(postData, req.user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, formattedPost, "Official notice posted"));
});

// 🚀 3. GET DEPT DETAILS
const getDeptDetails = asyncHandler(async (req, res) => {
  const { deptId } = req.params;

  const department = {
    _id: deptId,
    name: "Computer Science & Engineering",
    shortName: "CSE",
    coverImage: "https://placehold.co/800x200?text=CSE+Department",
    headOfDept: {
      fullName: "Dr. Anisul Islam",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=anisul",
    },
    contactEmail: "cse@university.edu",
    location: "Building 3, 4th Floor",
  };

  return res
    .status(200)
    .json(new ApiResponse(200, { department }, "Department details fetched"));
});

// 🚀 4. GET TEACHERS LIST
const getTeachers = asyncHandler(async (req, res) => {
  const { deptId } = req.params;

  const teachers = [
    {
      _id: "t_1",
      fullName: "Dr. Anisul Islam",
      designation: "Professor & Head",
      email: "anisul@uni.edu",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=anisul",
    },
    {
      _id: "t_2",
      fullName: "Ms. Farhana Ahmed",
      designation: "Lecturer",
      email: "farhana@uni.edu",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=farhana",
    },
  ];

  return res
    .status(200)
    .json(new ApiResponse(200, { teachers }, "Teachers list fetched"));
});

// ==========================================
// 🚀 POST & COMMENT ACTIONS (Shared Logic)
// ==========================================

// 🚀 TOGGLE LIKE DEPT POST
const toggleDeptPostLike = asyncHandler(async (req, res) => {
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
const toggleDeptPostRead = asyncHandler(async (req, res) => {
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

// 🚀 DELETE DEPT POST
const deleteDeptPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const result = await deletePostService(postId, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Post deleted successfully"));
});

// 🚀 UPDATE DEPT POST
const updateDeptPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const updatedPost = await updatePostService(postId, req.user._id, req.body);
  return res
    .status(200)
    .json(new ApiResponse(200, updatedPost, "Post updated successfully"));
});

// 🚀 GET POST COMMENTS
const getDeptPostComments = asyncHandler(async (req, res) => {
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
const createDeptPostComment = asyncHandler(async (req, res) => {
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
const deleteDeptPostComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const result = await deleteCommentService(commentId, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment deleted successfully"));
});

// 🚀 UPDATE COMMENT
const updateDeptPostComment = asyncHandler(async (req, res) => {
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
const toggleDeptPostCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const result = await toggleCommentLikeService(commentId, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment like toggled"));
});

export {
  getDeptFeed,
  createDeptPost,
  getDeptDetails,
  getTeachers,
  toggleDeptPostLike,
  toggleDeptPostRead,
  deleteDeptPost,
  updateDeptPost,
  getDeptPostComments,
  createDeptPostComment,
  deleteDeptPostComment,
  updateDeptPostComment,
  toggleDeptPostCommentLike,
};
