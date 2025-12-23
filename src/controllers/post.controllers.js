import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  POST_TARGET_MODELS,
  POST_TYPES,
  ATTACHMENT_TYPES,
  POST_VISIBILITY,
} from "../constants/index.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";

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

  // TODO: Implement Read/View Model Logic
  // When a post is created, we should automatically create an entry in the
  // Read/View Model marking it as 'read' for the author (since they created it).
  // Example: await PostView.create({ post: post._id, user: req.user._id, readAt: new Date() });

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
      isRead: true,
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
  // Mock Toggle Response
  // 1. Find post by ID
  // 2. Toggle isLiked status
  // 3. Update likesCount

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { postId, isLiked: true, likesCount: 25 },
        "Post liked/unliked successfully"
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
  // Mock Toggle Read
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { targetId: postId, isRead: true },
        "Read status toggled"
      )
    );
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
    // TODO: Check Friendship Status (Mocked as false for now, need Friendship Service)
    const isFriend = false;

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

  // 4. Add Context (isLiked, isSaved, etc.)
  // TODO: Fetch Likes/Saved status from Reaction/Bookmark Service
  const postsWithContext = posts.map((post) => ({
    ...post,
    stats: {
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      shares: post.sharesCount || 0,
    },
    context: {
      isLiked: false, // TODO: Check if currentUser liked this post (requires Like Model)
      isSaved: false, // TODO: Check if currentUser saved this post (requires SavedPost Model)
      isMine: isOwnProfile,
      isRead: true, // TODO: Check if currentUser read this post (requires Read/View Model)
    },
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

export {
  createPost,
  getFeedPosts,
  toggleLikePost,
  addComment,
  toggleMarkAsRead,
  getUserProfilePosts,
};
