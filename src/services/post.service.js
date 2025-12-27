// ==========================================
// post.service.js
// ==========================================
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { PostRead } from "../models/postRead.model.js";
import { Reaction } from "../models/reaction.model.js";
import { Friendship } from "../models/friendship.model.js";
import {
  POST_TARGET_MODELS,
  POST_TYPES,
  POST_VISIBILITY,
  REACTION_TARGET_MODELS,
  FRIENDSHIP_STATUS,
} from "../constants/index.js";
import { ApiError } from "../utils/ApiError.js";

// === Create Post Service ===
export const createPostService = async (postData, authorId) => {
  const {
    content,
    attachments,
    type,
    postOnModel,
    postOnId,
    visibility,
    pollOptions,
    tags,
  } = postData;

  // Validations
  if (!content || !type || !postOnModel || !postOnId) {
    throw new ApiError(400, "All fields are required");
  }

  if (!Object.values(POST_TYPES).includes(type)) {
    throw new ApiError(400, "Invalid post type");
  }

  if (!Object.values(POST_TARGET_MODELS).includes(postOnModel)) {
    throw new ApiError(400, "Invalid target model");
  }

  if (type === POST_TYPES.POLL) {
    if (!pollOptions || pollOptions.length < 2) {
      throw new ApiError(400, "Poll must have at least 2 options");
    }
  }

  if (postOnModel === POST_TARGET_MODELS.USER) {
    if (visibility === POST_VISIBILITY.INTERNAL) {
      throw new ApiError(
        400,
        "Internal visibility is not allowed for profile posts"
      );
    }
  }

  // Create post
  const post = await Post.create({
    content,
    attachments: attachments || [],
    type,
    postOnModel,
    postOnId,
    author: authorId,
    visibility: visibility || POST_VISIBILITY.PUBLIC,
    pollOptions: pollOptions || [],
    tags: tags || [],
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    isArchived: false,
    isPinned: false,
    isDeleted: false,
  });

  // Populate author details
  const populatedPost = await Post.findById(post._id).populate(
    "author",
    "fullName avatar userName"
  );

  // Mark as read for author
  await PostRead.create({
    post: post._id,
    user: authorId,
  });

  // Format response
  const formattedPost = {
    post: populatedPost,
    meta: {
      isLiked: false,
      isSaved: false,
      isMine: true,
      isRead: true,
    },
  };

  return formattedPost;
};

// === Toggle Like Service ===
export const toggleLikePostService = async (postId, userId) => {
  // Check if post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // Check if already liked
  const existingReaction = await Reaction.findOne({
    targetId: postId,
    targetModel: REACTION_TARGET_MODELS.POST,
    user: userId,
  });

  let isLiked = false;

  if (existingReaction) {
    // Unlike
    await Reaction.findByIdAndDelete(existingReaction._id);
    isLiked = false;
  } else {
    // Like
    await Reaction.create({
      targetId: postId,
      targetModel: REACTION_TARGET_MODELS.POST,
      user: userId,
    });
    isLiked = true;
  }

  // Get updated stats
  const updatedPost = await Post.findById(postId).select("likesCount");

  return {
    postId,
    isLiked,
    likesCount: updatedPost.likesCount,
  };
};

// === Toggle Mark as Read Service ===
export const toggleMarkAsReadService = async (postId, userId) => {
  // Check if already read
  const existingRead = await PostRead.findOne({
    post: postId,
    user: userId,
  });

  if (existingRead) {
    // Mark as unread
    await existingRead.deleteOne();
    return {
      targetId: postId,
      isRead: false,
    };
  } else {
    // Mark as read
    await PostRead.create({
      post: postId,
      user: userId,
    });
    return {
      targetId: postId,
      isRead: true,
    };
  }
};

// === Delete Post Service ===
export const deletePostService = async (postId, userId) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // Check authorization
  if (post.author.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this post");
  }

  // Soft delete
  post.isDeleted = true;
  await post.save();

  return { postId };
};

// === Update Post Service ===
export const updatePostService = async (postId, userId, updateData) => {
  const { content, visibility, tags } = updateData;

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // Check authorization
  if (post.author.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this post");
  }

  if (post.isDeleted) {
    throw new ApiError(404, "Post not found");
  }

  // Update fields
  let isContentChanged = false;

  if (content !== undefined && content !== post.content) {
    post.content = content;
    isContentChanged = true;
  }
  if (visibility !== undefined && visibility !== post.visibility) {
    post.visibility = visibility;
    // Visibility change shouldn't mark post as edited
  }
  if (
    tags !== undefined &&
    JSON.stringify(tags) !== JSON.stringify(post.tags)
  ) {
    post.tags = tags;
    isContentChanged = true;
  }

  if (isContentChanged) {
    post.isEdited = true;
    post.editedAt = new Date();
  }

  await post.save();

  // Return updated post with author details
  const updatedPostObj = await Post.findById(postId).populate(
    "author",
    "fullName avatar userName"
  );

  // Check like status
  const existingReaction = await Reaction.findOne({
    targetId: postId,
    targetModel: REACTION_TARGET_MODELS.POST,
    user: userId,
  });

  return {
    post: updatedPostObj,
    meta: {
      isLiked: !!existingReaction,
      isSaved: false,
      isMine: true,
      isRead: true,
    },
  };
};
