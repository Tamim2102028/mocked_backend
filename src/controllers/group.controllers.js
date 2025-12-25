import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { POST_TARGET_MODELS, POST_TYPES } from "../constants/index.js";
import mongoose from "mongoose";

const _objectId = () => new mongoose.Types.ObjectId().toString();

// 👥 GET GROUP FEED
const getGroupFeed = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const posts = await Post.find({
    postOnModel: POST_TARGET_MODELS.GROUP,
    postOnId: groupId,
    isDeleted: false,
  })
    .populate("author", "fullName userName avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalPosts = await Post.countDocuments({
    postOnModel: POST_TARGET_MODELS.GROUP,
    postOnId: groupId,
    isDeleted: false,
  });

  const formattedPosts = posts.map((post) => ({
    _id: post._id,
    content: post.content,
    type: post.type,
    postOnModel: post.postOnModel,
    postOnId: post.postOnId,
    author: post.author,
    stats: {
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: post.sharesCount,
    },
    context: {
      isLiked: false, // TODO: Implement reaction check
      isSaved: false,
      isRead: true,
      isMine: post.author._id.toString() === req.user._id.toString(),
    },
    createdAt: post.createdAt,
    isEdited: post.isEdited,
    editedAt: post.editedAt,
    tags: post.tags,
    images: post.attachments
      ?.filter((a) => a.type === "image")
      .map((a) => a.url),
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts: formattedPosts,
        pagination: {
          total: totalPosts,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalPosts / limit),
        },
      },
      "Group feed fetched"
    )
  );
});

// 👥 CREATE GROUP POST
const createGroupPost = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { content, type = POST_TYPES.GENERAL, attachments, tags } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const group = await Group.findById(groupId);
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const post = await Post.create({
    content,
    type,
    postOnModel: POST_TARGET_MODELS.GROUP,
    postOnId: groupId,
    author: req.user._id,
    attachments: attachments || [],
    tags: tags || [],
    visibility: POST_VISIBILITY.PUBLIC, // Group posts are usually public within context or handled by group privacy
  });

  const populatedPost = await Post.findById(post._id).populate(
    "author",
    "fullName userName avatar"
  );

  const formattedPost = {
    _id: populatedPost._id,
    content: populatedPost.content,
    type: populatedPost.type,
    postOnModel: populatedPost.postOnModel,
    postOnId: populatedPost.postOnId,
    author: populatedPost.author,
    stats: {
      likes: 0,
      comments: 0,
      shares: 0,
    },
    context: {
      isLiked: false,
      isSaved: false,
      isRead: true,
      isMine: true,
    },
    createdAt: populatedPost.createdAt,
    isEdited: populatedPost.isEdited,
    editedAt: populatedPost.editedAt,
    tags: populatedPost.tags,
    images: populatedPost.attachments
      ?.filter((a) => a.type === "image")
      .map((a) => a.url),
  };

  return res
    .status(201)
    .json(new ApiResponse(201, { post: formattedPost }, "Posted in group"));
});

// 🚀 3. CREATE GROUP
const createGroup = asyncHandler(async (req, res) => {
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
