import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { POST_TARGET_MODELS, POST_TYPES } from "../constants/index.js";
import mongoose from "mongoose";

const _simulateLatency = () => new Promise((r) => setTimeout(r, 1000));
const _objectId = () => new mongoose.Types.ObjectId().toString();

const getDeptFeed = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { deptId } = req.params;

  const posts = [
    {
      _id: "dept_post_1",
      content: "মিড-টার্ম পরীক্ষার রুটিন প্রকাশ করা হয়েছে।",
      type: POST_TYPES.NOTICE,
      postOnModel: POST_TARGET_MODELS.DEPARTMENT,
      postOnId: deptId,
      author: {
        _id: "u_head_1",
        fullName: "Department Head",
        userName: "cse_official",
        avatar: "https://ui-avatars.com/api/?name=Head",
        userType: "TEACHER",
      },
      stats: { likes: 120, comments: 0, shares: 50 },
      context: { isLiked: false, isSaved: true, isRead: false, isMine: false },
      createdAt: new Date().toISOString(),
    },
  ];

  return res
    .status(200)
    .json(new ApiResponse(200, { posts }, "Dept feed fetched"));
});

// Create Dept Post (Only for Admin/Head)
const createDeptPost = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { deptId } = req.params;
  const { content } = req.body;

  const post = {
    _id: _objectId(),
    content,
    type: POST_TYPES.NOTICE, // ডিপার্টমেন্ট মানেই অফিসিয়াল নোটিশ
    postOnModel: POST_TARGET_MODELS.DEPARTMENT,
    postOnId: deptId,
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
    .json(new ApiResponse(201, { post }, "Official notice posted"));
});

// 🚀 3. GET DEPT DETAILS
const getDeptDetails = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { deptId } = req.params;

  const department = {
    _id: deptId,
    name: "Computer Science & Engineering",
    shortName: "CSE",
    coverImage: "https://placehold.co/800x200?text=CSE+Department",
    headOfDept: {
      fullName: "Dr. Anisul Islam",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=anisul",
    },
    contactEmail: "cse@university.edu",
    location: "Building 3, 4th Floor",
  };

  return res
    .status(200)
    .json(new ApiResponse(200, { department }, "Department details fetched"));
});

// 🚀 4. GET TEACHERS LIST
const getTeachers = asyncHandler(async (req, res) => {
  await _simulateLatency();
  const { deptId } = req.params;

  const teachers = [
    {
      _id: "t_1",
      fullName: "Dr. Anisul Islam",
      designation: "Professor & Head",
      email: "anisul@uni.edu",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=anisul",
    },
    {
      _id: "t_2",
      fullName: "Ms. Farhana Ahmed",
      designation: "Lecturer",
      email: "farhana@uni.edu",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=farhana",
    },
  ];

  return res
    .status(200)
    .json(new ApiResponse(200, { teachers }, "Teachers list fetched"));
});

export { getDeptFeed, createDeptPost, getDeptDetails, getTeachers };
