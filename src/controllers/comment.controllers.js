import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

const _simulateLatency = () => new Promise((r) => setTimeout(r, 800));
const _objectId = () => new mongoose.Types.ObjectId().toString();

// 🚀 1. GET COMMENTS BY POST ID
const getPostComments = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { postId } = req.params;

  // Mock Comments List
  const comments = [
    {
      _id: "c_1",
      content: "খুবই সুন্দর বলেছেন ভাই!",
      post: postId,
      author: {
        _id: "u_55",
        fullName: "Karim Khan",
        userName: "karim_k",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=karim",
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      stats: { likes: 5, replies: 0 },
      isMine: false,
      isLiked: false,
    },
    {
      _id: "c_2",
      content: "আমারও সেম মতামত।",
      post: postId,
      author: {
        _id: req.user._id, // এটা আমার কমেন্ট
        fullName: req.user.fullName,
        userName: req.user.userName,
        avatar: req.user.avatar,
      },
      createdAt: new Date().toISOString(),
      stats: { likes: 0, replies: 0 },
      isMine: true, // 🔥 Delete বাটন দেখাবে
      isLiked: false,
    },
  ];

  return res
    .status(200)
    .json(new ApiResponse(200, { comments }, "Comments fetched"));
});

// 🚀 2. ADD COMMENT
const addComment = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { postId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Comment content is required");
  }

  // Mock Created Comment
  const comment = {
    _id: _objectId(),
    content: content,
    post: postId,
    author: {
      _id: req.user._id,
      fullName: req.user.fullName,
      userName: req.user.userName,
      avatar: req.user.avatar,
    },
    createdAt: new Date().toISOString(),
    stats: { likes: 0, replies: 0 },
    isMine: true,
    isLiked: false,
  };

  return res
    .status(201)
    .json(new ApiResponse(201, { comment }, "Comment added successfully"));
});

// 🚀 3. DELETE COMMENT
const deleteComment = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { commentId } = req.params;

  // Mock Success
  return res
    .status(200)
    .json(new ApiResponse(200, { commentId }, "Comment deleted"));
});

// 🚀 4. UPDATE COMMENT
const updateComment = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const comment = {
    _id: commentId,
    content: content,
    updatedAt: new Date().toISOString(),
  };

  return res
    .status(200)
    .json(new ApiResponse(200, { comment }, "Comment updated successfully"));
});

export { getPostComments, addComment, deleteComment, updateComment };
