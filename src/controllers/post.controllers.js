import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  POST_TARGET_MODELS,
  POST_TYPES,
  ATTACHMENT_TYPES,
  POST_VISIBILITY,
  REACTION_TARGET_MODELS,
  FRIENDSHIP_STATUS,
} from "../constants/index.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { PostRead } from "../models/postRead.model.js";
import { Reaction } from "../models/reaction.model.js";
import { Friendship } from "../models/friendship.model.js";
import { Comment } from "../models/comment.model.js";

// =========================
// 🚀 1. CREATE POST
// =========================
const createPost = asyncHandler(async (req, res) => {
  // those field should be came from req.body
  const {
    content,
    attachments,
    type,
    postOnModel,
    postOnId,
    visibility,
    pollOptions,
    tags,
  } = req.body;

  // Must Check (content, type, postOnModel, postOnId)
  if (!content || !type || !postOnModel || !postOnId) {
    throw new ApiError(400, "All fields are required");
  }

  // ✅ Validate Enums
  if (!Object.values(POST_TYPES).includes(type)) {
    throw new ApiError(400, "Invalid post type");
  }
  if (!Object.values(POST_TARGET_MODELS).includes(postOnModel)) {
    throw new ApiError(400, "Invalid target model");
  }

  // ✅ Poll Validation
  if (type === POST_TYPES.POLL) {
    if (!pollOptions || pollOptions.length < 2) {
      throw new ApiError(400, "Poll must have at least 2 options");
    }
  }

  // ✅ Profile Post Restrictions
  // When posting on a User Profile (postOnModel === 'User'),
  // visibility cannot be 'INTERNAL'.
  if (postOnModel === POST_TARGET_MODELS.USER) {
    if (visibility === POST_VISIBILITY.INTERNAL) {
      throw new ApiError(
        400,
        "Internal visibility is not allowed for profile posts"
      );
    }
  }

  const post = await Post.create({
    content: content,
    attachments: attachments || [],
    type: type,
    postOnModel: postOnModel,
    postOnId: postOnId,
    author: req.user._id,
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

  // ✅ Populate Author details for Frontend immediate update
  const populatedPost = await Post.findById(post._id).populate(
    "author",
    "fullName avatar userName"
  );

  // ✅ Automatically mark as 'read' for the author
  await PostRead.create({
    post: post._id,
    user: req.user._id,
  });

  // 🔄 Transform to Match Frontend Expectation (Mock Data Structure)
  const formattedPost = {
    ...populatedPost.toObject(),
    attachments: populatedPost.attachments || [],
    stats: {
      likes: populatedPost.likesCount || 0,
      comments: populatedPost.commentsCount || 0,
      shares: populatedPost.sharesCount || 0,
    },
    context: {
      isLiked: false,
      isSaved: false,
      isMine: true,
      isRead: true, // Author always reads their own post initially
    },
  };

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
// 🚀 3-4-5.(Like, Comment, mark as read)
// =========================

const toggleLikePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  // 1. Check if post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // 2. Check if already liked
  const existingReaction = await Reaction.findOne({
    targetId: postId,
    targetModel: REACTION_TARGET_MODELS.POST,
    user: userId,
  });

  let isLiked = false;

  if (existingReaction) {
    // Unlike -> Delete Reaction (Middleware updates likesCount)
    await Reaction.findByIdAndDelete(existingReaction._id);
    isLiked = false;
  } else {
    // Like -> Create Reaction (Middleware updates likesCount)
    await Reaction.create({
      targetId: postId,
      targetModel: REACTION_TARGET_MODELS.POST,
      user: userId,
    });
    isLiked = true;
  }

  // 3. Get updated post stats
  const updatedPost = await Post.findById(postId).select("likesCount");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        postId,
        isLiked,
        likesCount: updatedPost.likesCount,
      },
      isLiked ? "Post liked" : "Post unliked"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  const comment = {
    _id: new mongoose.Types.ObjectId().toString(),
    post: postId,
    content,
    author: {
      _id: req.user._id,
      fullName: req.user.fullName,
      userName: req.user.userName,
      avatar: req.user.avatar,
    },
    stats: { likes: 0, replies: 0 },
    parentId: null,
    createdAt: new Date().toISOString(),
  };

  return res
    .status(201)
    .json(new ApiResponse(201, { comment }, "Comment added"));
});

const toggleMarkAsRead = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  // Check if already read
  const existingRead = await PostRead.findOne({
    post: postId,
    user: userId,
  });

  if (existingRead) {
    // Already read -> Mark as Unread (Delete entry)
    await existingRead.deleteOne();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { targetId: postId, isRead: false },
          "Marked as unread"
        )
      );
  } else {
    // Not read -> Mark as Read (Create entry)
    await PostRead.create({
      post: postId,
      user: userId,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { targetId: postId, isRead: true },
          "Marked as read"
        )
      );
  }
});

// =========================
// 🚀 6. GET USER PROFILE POSTS (By Username)
// =========================
const getUserProfilePosts = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // 1. Find Target User
  const targetUser = await User.findOne({ userName: username }).select("_id");
  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  const currentUserId = req.user?._id;
  const isOwnProfile = currentUserId?.toString() === targetUser._id.toString();

  // 1.1 Block Check
  if (currentUserId && !isOwnProfile) {
    const blockRelation = await Friendship.findOne({
      $or: [
        { requester: currentUserId, recipient: targetUser._id },
        { requester: targetUser._id, recipient: currentUserId },
      ],
      status: FRIENDSHIP_STATUS.BLOCKED,
    });

    if (blockRelation) {
      if (blockRelation.requester.toString() === targetUser._id.toString()) {
        throw new ApiError(403, "You are blocked by this user");
      } else {
        throw new ApiError(
          403,
          "You have blocked this user. Unblock to see posts."
        );
      }
    }
  }

  // 2. Build Query based on Visibility & Friendship
  let visibilityQuery = {
    postOnId: targetUser._id,
    postOnModel: POST_TARGET_MODELS.USER,
    isDeleted: false,
    isArchived: false,
  };

  if (isOwnProfile) {
    // Own Profile: See everything (Public, Connections, Only Me, Internal)
    // No additional filter needed
  } else {
    // Visitor: Check Relationship
    let isFriend = false;

    if (currentUserId) {
      const friendship = await Friendship.findOne({
        $or: [
          { requester: currentUserId, recipient: targetUser._id },
          { requester: targetUser._id, recipient: currentUserId },
        ],
        status: FRIENDSHIP_STATUS.ACCEPTED,
      });
      if (friendship) isFriend = true;
    }

    if (isFriend) {
      // Friend: See Public + Connections
      visibilityQuery.visibility = {
        $in: [POST_VISIBILITY.PUBLIC, POST_VISIBILITY.CONNECTIONS],
      };
    } else {
      // Public User: See only Public
      visibilityQuery.visibility = POST_VISIBILITY.PUBLIC;
    }
  }

  // 3. Fetch Posts with Pagination
  const posts = await Post.find(visibilityQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("author", "fullName avatar userName")
    .lean();

  // 4. Add Context (isLiked, isSaved, isRead)
  // Fetch Read Status for these posts
  let viewedPostIds = new Set();
  let likedPostIds = new Set();
  const postIds = posts.map((p) => p._id);

  // ✅ Get Real-time Comment Counts (Fix for mismatched counts)
  const commentCounts = await Comment.aggregate([
    {
      $match: {
        post: { $in: postIds },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$post",
        count: { $sum: 1 },
      },
    },
  ]);

  const commentCountMap = {};
  commentCounts.forEach((c) => {
    commentCountMap[c._id.toString()] = c.count;
  });

  if (currentUserId && posts.length > 0) {
    const viewedPosts = await PostRead.find({
      user: currentUserId,
      post: { $in: postIds },
    }).select("post");

    viewedPostIds = new Set(viewedPosts.map((vp) => vp.post.toString()));

    // Fetch Like Status (Reactions)
    const likedPosts = await Reaction.find({
      user: currentUserId,
      targetModel: REACTION_TARGET_MODELS.POST,
      targetId: { $in: postIds },
    }).select("targetId");

    likedPostIds = new Set(likedPosts.map((r) => r.targetId.toString()));
  }

  // TODO: Fetch Saved status from Bookmark Service
  const postsWithContext = posts.map((post) => ({
    ...post,
    stats: {
      likes: post.likesCount || 0,
      comments: commentCountMap[post._id.toString()] || 0, // Use calculated count
      shares: post.sharesCount || 0,
    },
    context: {
      isLiked: likedPostIds.has(post._id.toString()),
      isSaved: false, // TODO: Check if currentUser saved this post (requires SavedPost Model)
      isMine: isOwnProfile,
      isRead: viewedPostIds.has(post._id.toString()),
    },
    isEdited: post.isEdited || false,
    editedAt: post.editedAt,
  }));

  // 5. Count Total Documents for Pagination
  const totalDocs = await Post.countDocuments(visibilityQuery);
  const hasNextPage = totalDocs > skip + posts.length;

  const data = {
    posts: postsWithContext,
    hasNextPage,
    nextPage: hasNextPage ? page + 1 : null,
    totalDocs,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "User posts fetched successfully"));
});

// =========================
// 🚀 7. DELETE POST (Soft Delete)
// =========================
const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // Check Authorization
  if (post.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this post");
  }

  // Soft Delete (Better for data integrity)
  post.isDeleted = true;
  await post.save();

  // OR Hard Delete (If you want to remove it completely)
  // await Post.findByIdAndDelete(postId);

  return res
    .status(200)
    .json(new ApiResponse(200, { postId }, "Post deleted successfully"));
});

// =========================
// 🚀 8. UPDATE POST
// =========================
const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content, visibility, tags } = req.body;

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // Check Authorization
  if (post.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this post");
  }

  if (post.isDeleted) {
    throw new ApiError(404, "Post not found");
  }

  // Update fields
  let isChanged = false;
  if (content !== undefined && content !== post.content) {
    post.content = content;
    isChanged = true;
  }
  if (visibility !== undefined && visibility !== post.visibility) {
    post.visibility = visibility;
    isChanged = true;
  }
  if (
    tags !== undefined &&
    JSON.stringify(tags) !== JSON.stringify(post.tags)
  ) {
    post.tags = tags;
    isChanged = true;
  }

  if (isChanged) {
    post.isEdited = true;
    post.editedAt = new Date();
  }

  await post.save();

  // Return the updated post with author details populated
  const updatedPost = await Post.findById(postId).populate(
    "author",
    "fullName avatar userName"
  );

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
