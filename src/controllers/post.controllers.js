import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { POST_TARGET_MODELS, POST_TYPES } from "../constants/index.js";
import mongoose from "mongoose";

// ⏳ Helper: Simulate Network Delay
const _simulateLatency = () =>
  new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));

// 🆔 Helper: Generate ObjectId
const _objectId = () => new mongoose.Types.ObjectId().toString();

// ==============================================================================
// 🚀 1. CREATE POST (Unified Handler)
// ==============================================================================
const createPost = asyncHandler(async (req, res) => {
  await _simulateLatency();

  const {
    content,
    type = POST_TYPES.GENERAL,
    targetModel = POST_TARGET_MODELS.USER,
    targetId = req.user._id,
    pollOptions = [],
    attachments = [],
  } = req.body;

  // Validation
  if (
    !content?.trim() &&
    attachments.length === 0 &&
    type !== POST_TYPES.POLL
  ) {
    throw new ApiError(400, "Content or attachment is required");
  }

  const now = new Date().toISOString();

  // Construct Mock Response
  const post = {
    _id: _objectId(),
    content: content || "",
    attachments: attachments,
    type: type, // GENERAL, NOTICE, ASSIGNMENT, etc.

    // 📍 Location Info
    postOnModel: targetModel,
    postOnId: targetId,

    // 👤 Real Author Info
    author: {
      _id: req.user._id,
      fullName: req.user.fullName,
      userName: req.user.userName,
      avatar: req.user.avatar,
      userType: req.user.userType,
    },

    // 📊 Poll Options (If any)
    pollOptions: type === POST_TYPES.POLL ? pollOptions : [],

    // 📈 Stats
    stats: { likes: 0, comments: 0, shares: 0 },

    // ⚙️ User Context
    context: {
      isLiked: false,
      isSaved: false,
      isMine: true,
      isRead: true,
      isFollowing: false,
    },

    createdAt: now,
    updatedAt: now,
  };

  return res
    .status(201)
    .json(new ApiResponse(201, { post }, "Post created successfully"));
});

// ==============================================================================
// 🚀 2. GET FEED (Mixed Types & Locations)
// ==============================================================================
const getFeed = asyncHandler(async (req, res) => {
  await _simulateLatency();

  // Mock Data: ৩টি ভিন্ন টাইপ এবং লোকেশনের উদাহরণ
  const posts = [
    // 🔔 1. DEPARTMENT NOTICE (Official)
    {
      _id: "p_dept_101",
      content:
        "আগামীকাল থেকে মিড-টার্ম পরীক্ষার ফর্ম ফিলাপ শুরু হবে। সবাইকে অফিসে যোগাযোগ করার জন্য বলা হলো।",

      type: POST_TYPES.NOTICE, // ✅ NOTICE Type
      postOnModel: POST_TARGET_MODELS.DEPARTMENT, // 📍 Dept Page
      postOnId: "dept_cse_id",
      attachments: [],

      author: {
        _id: "u_head_1",
        fullName: "CSE Head",
        userName: "cse_official",
        avatar:
          "https://ui-avatars.com/api/?name=Dept+Head&background=0D8ABC&color=fff",
        userType: "TEACHER",
      },
      stats: { likes: 120, comments: 10, shares: 50 },
      context: { isLiked: false, isSaved: false, isRead: false, isMine: false },
      createdAt: new Date().toISOString(),
    },

    // 📝 2. CR CORNER (Assignment / Notice)
    {
      _id: "p_cr_202",
      content: "Chemistry Lab Report Submit করার শেষ সময় ২ দিন বাড়ানো হয়েছে।",

      type: POST_TYPES.NOTICE, // ✅ NOTICE (CR দিচ্ছে)
      postOnModel: POST_TARGET_MODELS.CR_CORNER, // 📍 CR Corner
      postOnId: "cr_section_a",
      attachments: [],

      author: {
        _id: "u_cr_1",
        fullName: "Fahim (CR)",
        userName: "fahim_cr",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=fahim",
        userType: "STUDENT",
      },
      stats: { likes: 45, comments: 20, shares: 2 },
      context: { isLiked: true, isSaved: true, isRead: true, isMine: false },
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },

    // ❓ 3. STUDENT QUESTION (General Group)
    {
      _id: "p_group_303",
      content: "Mid-term এর সিলেবাসে কি Chapter 5 আছে? কেউ জানলে একটু বলবেন।",

      type: POST_TYPES.QUESTION, // ❓ QUESTION Type
      postOnModel: POST_TARGET_MODELS.GROUP,
      postOnId: "group_study_1",
      attachments: [],

      author: {
        _id: "u_student_5",
        fullName: "Sumaya Akter",
        userName: "sumaya_s",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sumaya",
        userType: "STUDENT",
      },
      stats: { likes: 2, comments: 8, shares: 0 },
      context: { isLiked: false, isSaved: false, isRead: true, isMine: false },
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },

    // 📊 4. POLL
    {
      _id: "p_poll_404",
      content: "আমাদের ব্যাচ ট্যুর কোথায় হওয়া উচিত?",
      type: POST_TYPES.POLL, // 📊 POLL Type
      postOnModel: POST_TARGET_MODELS.CR_CORNER,
      postOnId: "cr_section_a",
      attachments: [],

      author: {
        _id: "u_cr_1",
        fullName: "Fahim (CR)",
        userName: "fahim_cr",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=fahim",
        userType: "STUDENT",
      },
      pollOptions: [
        { text: "Cox's Bazar", votes: 40 },
        { text: "Sylhet", votes: 25 },
        { text: "Sajek", votes: 60 },
      ],
      stats: { likes: 10, comments: 50, shares: 0 },
      context: { isLiked: false, isSaved: false, isRead: true, isMine: false },
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
  ];

  const data = {
    posts,
    hasNextPage: true, // Mock pagination
    nextPage: 2,
    totalDocs: 100,
  };
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Feed fetched successfully"));
});

// ==============================================================================
// 🚀 3. OTHER ACTIONS (Like, Comment, Read)
// ==============================================================================

const likePost = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { postId } = req.params;
  // Mock Toggle Response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { postId, isLiked: true, likesCount: 25 },
        "Post liked"
      )
    );
});

const addComment = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { postId } = req.params;
  const { content } = req.body;

  const comment = {
    _id: _objectId(),
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
  await _simulateLatency();
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

export { createPost, getFeed, likePost, addComment, toggleMarkAsRead };
