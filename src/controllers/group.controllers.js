import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { POST_TARGET_MODELS, POST_TYPES } from "../constants/index.js";
import mongoose from "mongoose";

const _simulateLatency = () => new Promise((r) => setTimeout(r, 1000));
const _objectId = () => new mongoose.Types.ObjectId().toString();

// 👥 GET GROUP FEED
const getGroupFeed = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { groupId } = req.params;

  const posts = [
    {
      _id: "grp_post_1",
      content: "Physics Chapter 5 এর নোটস কারো কাছে আছে?",
      type: POST_TYPES.QUESTION,
      postOnModel: POST_TARGET_MODELS.GROUP,
      postOnId: groupId,
      author: {
        _id: "u_std_5",
        fullName: "Sumaya",
        userName: "sumaya_s",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sumaya",
      },
      stats: { likes: 2, comments: 8, shares: 0 },
      context: { isLiked: false, isSaved: false, isRead: true, isMine: false },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  return res
    .status(200)
    .json(new ApiResponse(200, { posts }, "Group feed fetched"));
});

// 👥 CREATE GROUP POST
const createGroupPost = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { groupId } = req.params;
  const { content, type = POST_TYPES.GENERAL } = req.body;

  const post = {
    _id: _objectId(),
    content,
    type,
    postOnModel: POST_TARGET_MODELS.GROUP,
    postOnId: groupId,
    author: {
      _id: req.user._id,
      fullName: req.user.fullName,
      userName: req.user.userName,
      avatar: req.user.avatar,
    },
    stats: { likes: 0, comments: 0, shares: 0 },
    context: { isLiked: false, isSaved: false, isRead: true, isMine: true },
    createdAt: new Date().toISOString(),
  };

  return res
    .status(201)
    .json(new ApiResponse(201, { post }, "Posted in group"));
});

// 🚀 3. CREATE GROUP
const createGroup = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { name, description, privacy = "PUBLIC" } = req.body;

  if (!name) {
    throw new ApiError(400, "Group name is required");
  }

  const group = {
    _id: _objectId(),
    name,
    description,
    privacy,
    creator: req.user._id,
    membersCount: 1,
    coverImage: "https://placehold.co/600x200?text=Group+Cover",
    createdAt: new Date().toISOString(),
    isMember: true,
    isAdmin: true,
  };

  return res
    .status(201)
    .json(new ApiResponse(201, { group }, "Group created successfully"));
});

// 🚀 4. GET MY GROUPS
const getMyGroups = asyncHandler(async (req, res) => {
  await _simulateLatency();

  const groups = [
    {
      _id: "grp_1",
      name: "Study Circle - CSE 101",
      membersCount: 45,
      privacy: "PUBLIC",
      coverImage: "https://placehold.co/100x100?text=CSE",
      isMember: true,
    },
    {
      _id: "grp_2",
      name: "Football Lovers",
      membersCount: 120,
      privacy: "PUBLIC",
      coverImage: "https://placehold.co/100x100?text=Football",
      isMember: true,
    },
  ];

  return res
    .status(200)
    .json(new ApiResponse(200, { groups }, "Groups fetched successfully"));
});

// 🚀 5. JOIN GROUP
const joinGroup = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { groupId } = req.params;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { groupId, status: "JOINED" },
        "Joined group successfully"
      )
    );
});

// 🚀 6. GET GROUP DETAILS
const getGroupDetails = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { groupId } = req.params;

  const group = {
    _id: groupId,
    name: "Study Circle - CSE 101",
    description: "A group for discussing CSE 101 topics.",
    privacy: "PUBLIC",
    membersCount: 45,
    coverImage: "https://placehold.co/600x200?text=Group+Cover",
    creator: {
      _id: "u_creator",
      fullName: "Admin User",
      userName: "admin_u",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    },
    isMember: true,
    isAdmin: false,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  };

  return res
    .status(200)
    .json(new ApiResponse(200, { group }, "Group details fetched"));
});

export {
  getGroupFeed,
  createGroupPost,
  createGroup,
  getMyGroups,
  joinGroup,
  getGroupDetails,
};
