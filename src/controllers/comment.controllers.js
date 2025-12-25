import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import { Reaction } from "../models/reaction.model.js";
import { REACTION_TARGET_MODELS } from "../constants/index.js";
import mongoose from "mongoose";

// 🚀 1. GET COMMENTS BY POST ID (With Pagination & Soft Delete check)
const getPostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // কমেন্ট লিস্ট ফেচ করা (পপুলেট সহ)
  const comments = await Comment.find({
    post: postId,
    isDeleted: false,
  })
    .populate("author", "fullName userName avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalComments = await Comment.countDocuments({
    post: postId,
    isDeleted: false,
  });

  // Check if current user liked these comments
  const commentIds = comments.map((c) => c._id);
  const userReactions = await Reaction.find({
    targetId: { $in: commentIds },
    targetModel: REACTION_TARGET_MODELS.COMMENT,
    user: req.user._id,
  });
  const likedCommentIds = new Set(
    userReactions.map((r) => r.targetId.toString())
  );

  // ফরম্যাট করা ডাটা (ফ্রন্টএন্ডের জন্য)
  const formattedComments = comments.map((comment) => ({
    _id: comment._id,
    content: comment.content,
    post: comment.post,
    author: comment.author,
    createdAt: comment.createdAt,
    stats: {
      likes: comment.likesCount,
    },
    isMine: comment.author._id.toString() === req.user._id.toString(),
    isLiked: likedCommentIds.has(comment._id.toString()),
    updatedAt: comment.updatedAt,
    isEdited: comment.isEdited,
    editedAt: comment.editedAt,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments: formattedComments,
        pagination: {
          totalComments,
          totalPages: Math.ceil(totalComments / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      },
      "Comments fetched successfully"
    )
  );
});

// 🚀 2. ADD COMMENT
const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const newComment = await Comment.create({
    content,
    post: postId,
    author: req.user._id,
  });

  const comment = await Comment.findById(newComment._id).populate(
    "author",
    "fullName userName avatar"
  );

  // Increment post comment count
  await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

  const formattedComment = {
    _id: comment._id,
    content: comment.content,
    post: comment.post,
    author: comment.author,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    stats: { likes: 0 },
    isMine: true,
    isLiked: false,
    isEdited: false,
    editedAt: null,
  };

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { comment: formattedComment },
        "Comment added successfully"
      )
    );
});

// 🚀 3. DELETE COMMENT (Soft Delete)
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // চেক করা যে ইউজার নিজের কমেন্ট ডিলিট করছে কিনা
  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  // Soft Delete
  comment.isDeleted = true;
  await comment.save();

  // Decrement post comment count
  await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

  return res
    .status(200)
    .json(new ApiResponse(200, { commentId }, "Comment deleted successfully"));
});

// 🚀 4. UPDATE COMMENT
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Content is required");
  }

  const comment = await Comment.findById(commentId);

  if (!comment || comment.isDeleted) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }

  comment.content = content;
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();

  const updatedComment = await Comment.findById(commentId).populate(
    "author",
    "fullName userName avatar"
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comment: {
          _id: updatedComment._id,
          content: updatedComment.content,
          author: updatedComment.author,
          updatedAt: updatedComment.updatedAt,
          isEdited: updatedComment.isEdited,
          editedAt: updatedComment.editedAt,
        },
      },
      "Comment updated successfully"
    )
  );
});

// 🚀 5. TOGGLE COMMENT LIKE
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const existingReaction = await Reaction.findOne({
    targetId: commentId,
    targetModel: REACTION_TARGET_MODELS.COMMENT,
    user: userId,
  });

  let isLiked = false;

  if (existingReaction) {
    await Reaction.findByIdAndDelete(existingReaction._id);
    isLiked = false;
  } else {
    await Reaction.create({
      targetId: commentId,
      targetModel: REACTION_TARGET_MODELS.COMMENT,
      user: userId,
    });
    isLiked = true;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked }, "Comment like toggled"));
});

export {
  getPostComments,
  addComment,
  deleteComment,
  updateComment,
  toggleCommentLike,
};
