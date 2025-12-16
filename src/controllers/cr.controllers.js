import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { POST_TARGET_MODELS, POST_TYPES } from "../constants/index.js";
import mongoose from "mongoose";

const _simulateLatency = () => new Promise((r) => setTimeout(r, 1000));
const _objectId = () => new mongoose.Types.ObjectId().toString();

// 📢 GET CR FEED
const getCrFeed = asyncHandler(async (req, res) => {
  await _simulateLatency();

  const posts = [
    {
      _id: "cr_notice_1",
      content: "আগামীকাল ১০টার ক্লাস হবে না, স্যার অসুস্থ।",
      type: POST_TYPES.NOTICE,
      postOnModel: POST_TARGET_MODELS.CR_CORNER,
      postOnId: "section_a",
      author: {
        _id: "u_cr_1",
        fullName: "Fahim (CR)",
        userName: "fahim_cr",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=fahim",
        userType: "STUDENT",
        isCr: true,
      },
      stats: { likes: 45, comments: 12, shares: 0 },
      context: { isLiked: false, isSaved: true, isRead: false, isMine: false },
      createdAt: new Date().toISOString(),
    },
  ];

  return res
    .status(200)
    .json(new ApiResponse(200, { posts }, "CR Corner feed fetched"));
});

// 📢 CREATE CR NOTICE
const createCrPost = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { content } = req.body;

  const post = {
    _id: _objectId(),
    content,
    type: POST_TYPES.NOTICE, // CR এর পোস্ট মানেই নোটিশ
    postOnModel: POST_TARGET_MODELS.CR_CORNER,
    postOnId: req.user.academicInfo?.department || "dept_id",
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
    .json(new ApiResponse(201, { post }, "Notice posted in CR Corner"));
});

export { getCrFeed, createCrPost };
