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

  /*
 const post = await PostModel.create({
    content: content,
    attachments: attachments || [],
    type: type,
    postOnId: postOnId,
    postOnModel: postOnModel,
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
  })

  */

  return res
    .status(201)
    .json(new ApiResponse(201, { post }, "Post created successfully"));
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
  const isOwnProfile = req.user.userName === username;

  // 1. Fetch User Details (from DB or req.user)
  let authorDetails;

  if (isOwnProfile) {
    authorDetails = {
      _id: req.user._id,
      fullName: req.user.fullName,
      userName: req.user.userName,
      avatar: req.user.avatar,
      userType: req.user.userType,
    };
  } else {
    const user = await User.findOne({ userName: username }).select(
      "_id fullName userName avatar userType"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    authorDetails = {
      _id: user._id,
      fullName: user.fullName,
      userName: user.userName,
      avatar: user.avatar,
      userType: user.userType || "student", // Fallback if missing
    };
  }

  // 📝 Future Logic:
  // 1. Find user by username
  // 2. Query Post model where author._id === user._id
  // 3. Filter by privacy settings (public/friends/only_me)
  // 4. Populate author details
  // 5. Paginate results

  let posts = [];

  if (isOwnProfile) {
    posts = [
      {
        _id: "my_p_1",
        content: "Just updated my profile picture! 📸 #NewLook",
        images: [],
        videos: [],
        docs: [],
        type: POST_TYPES.GENERAL,
        postOnModel: POST_TARGET_MODELS.USER,
        postOnId: authorDetails._id,
        visibility: POST_VISIBILITY.PUBLIC,
        author: authorDetails,
        stats: { likes: 10, comments: 2, shares: 0 },
        context: {
          isLiked: false,
          isSaved: false,
          isMine: true,
          isRead: true,
        },
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        _id: "my_p_2_private",
        content: "Personal notes: Need to finish the project by Friday. 📝",
        images: [],
        videos: [],
        docs: [],
        type: POST_TYPES.GENERAL,
        postOnModel: POST_TARGET_MODELS.USER,
        postOnId: authorDetails._id,
        visibility: POST_VISIBILITY.ONLY_ME, // ✅ Visible only to me
        author: authorDetails,
        stats: { likes: 0, comments: 0, shares: 0 },
        context: {
          isLiked: false,
          isSaved: false,
          isMine: true,
          isRead: true,
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        _id: "my_p_3_img",
        content: "Throwback to the last vacation! 🌊",
        images: [
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000",
        ],
        videos: [],
        docs: [],
        type: POST_TYPES.GENERAL,
        postOnModel: POST_TARGET_MODELS.USER,
        postOnId: authorDetails._id,
        visibility: POST_VISIBILITY.CONNECTIONS,
        author: authorDetails,
        stats: { likes: 25, comments: 5, shares: 1 },
        context: {
          isLiked: true,
          isSaved: true,
          isMine: true,
          isRead: true,
        },
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
  } else {
    posts = [
      {
        _id: "other_p_1",
        content: `Hello from ${authorDetails.fullName}! 👋 This is a public post.`,
        images: [
          "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=1000",
        ],
        videos: [],
        docs: [],
        type: POST_TYPES.GENERAL,
        postOnModel: POST_TARGET_MODELS.USER,
        postOnId: authorDetails._id,
        visibility: POST_VISIBILITY.PUBLIC,
        author: authorDetails,
        stats: { likes: 125, comments: 45, shares: 12 },
        context: {
          isLiked: true,
          isSaved: true,
          isMine: false,
          isRead: true,
        },
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        _id: "other_p_1",
        content: `Hello from ${authorDetails.fullName}! 👋 This is a friend only post.`,
        images: [],
        videos: [],
        docs: [],
        type: POST_TYPES.GENERAL,
        postOnModel: POST_TARGET_MODELS.USER,
        postOnId: authorDetails._id,
        visibility: POST_VISIBILITY.CONNECTIONS, // ✅ Visible if friends (Mocking friendship)
        author: authorDetails,
        stats: { likes: 125, comments: 45, shares: 12 },
        context: {
          isLiked: true,
          isSaved: true,
          isMine: false,
          isRead: true,
        },
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        _id: "other_p_2",
        content: "Enjoying the weekend! ☀️",
        images: [],
        videos: [],
        docs: [],
        type: POST_TYPES.GENERAL,
        postOnModel: POST_TARGET_MODELS.USER,
        postOnId: authorDetails._id,
        visibility: POST_VISIBILITY.CONNECTIONS, // ✅ Visible if friends (Mocking friendship)
        author: authorDetails,
        stats: { likes: 50, comments: 10, shares: 1 },
        context: {
          isLiked: false,
          isSaved: false,
          isMine: false,
          isRead: true,
        },
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
  }

  const data = {
    posts,
    hasNextPage: false,
    nextPage: null,
    totalDocs: posts.length,
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
