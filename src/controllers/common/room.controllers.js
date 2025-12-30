import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { POST_TARGET_MODELS, POST_TYPES } from "../../constants/index.js";
import mongoose from "mongoose";

const _objectId = () => new mongoose.Types.ObjectId().toString();

// 🏫 GET ROOM FEED
const getRoomFeed = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const posts = [
    // Teacher Uploaded a Resource
    {
      _id: "room_post_1",
      content: "Lecture 5 এর স্লাইড আপলোড করা হলো। সবাই দেখে নিও।",
      type: POST_TYPES.RESOURCE,
      postOnModel: POST_TARGET_MODELS.ROOM,
      postOnId: roomId,
      attachments: [
        {
          type: "PDF",
          url: "https://example.com/slide.pdf",
          name: "Lecture_5.pdf",
        },
      ],
      author: {
        _id: "u_teacher_1",
        fullName: "Dr. Anisul Islam",
        userName: "anisul_sir",
        avatar: "https://ui-avatars.com/api/?name=Anisul+Islam",
        userType: "TEACHER",
      },
      stats: { likes: 15, comments: 2, shares: 0 },
      context: { isLiked: true, isSaved: true, isRead: true, isMine: false },
      createdAt: new Date().toISOString(),
    },
    // Student Asking Question
    {
      _id: "room_post_2",
      content: "স্যার, স্লাইডের ৩ নম্বর পেইজের ডায়াগ্রামটা বুঝিনি।",
      type: POST_TYPES.QUESTION,
      postOnModel: POST_TARGET_MODELS.ROOM,
      postOnId: roomId,
      author: {
        _id: "u_std_10",
        fullName: "Rahim",
        userName: "rahim_std",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahim",
        userType: "STUDENT",
      },
      stats: { likes: 1, comments: 1, shares: 0 },
      context: { isLiked: false, isSaved: false, isRead: true, isMine: false },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  return res
    .status(200)
    .json(new ApiResponse(200, { posts }, "Room feed fetched"));
});

// 🏫 CREATE ROOM POST
const createRoomPost = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { content, type = POST_TYPES.GENERAL, attachments = [] } = req.body;

  const post = {
    _id: _objectId(),
    content,
    type,
    postOnModel: POST_TARGET_MODELS.ROOM,
    postOnId: roomId,
    attachments,
    author: {
      _id: req.user._id,
      fullName: req.user.fullName,
      userName: req.user.userName,
      avatar: req.user.avatar,
      userType: req.user.userType,
    },
    stats: { likes: 0, comments: 0, shares: 0 },
    context: { isLiked: false, isSaved: false, isRead: true, isMine: true },
    createdAt: new Date().toISOString(),
  };

  return res
    .status(201)
    .json(new ApiResponse(201, { post }, "Posted in classroom"));
});

// 🚀 3. GET MY ROOMS
const getMyRooms = asyncHandler(async (req, res) => {
  const rooms = [
    {
      _id: "room_cse101",
      name: "CSE 101: Introduction to Computer Systems",
      code: "CSE101",
      session: "2023-24",
      section: "A",
      instructor: {
        fullName: "Dr. Anisul Islam",
      },
      membersCount: 45,
      coverImage: "https://placehold.co/100x100?text=CSE101",
    },
    {
      _id: "room_math101",
      name: "MATH 101: Calculus I",
      code: "MATH101",
      session: "2023-24",
      section: "A",
      instructor: {
        fullName: "Prof. Jamal Uddin",
      },
      membersCount: 50,
      coverImage: "https://placehold.co/100x100?text=MATH101",
    },
  ];

  return res
    .status(200)
    .json(new ApiResponse(200, { rooms }, "My rooms fetched"));
});

// 🚀 4. CREATE ROOM
const createRoom = asyncHandler(async (req, res) => {
  const { name, code, session, section } = req.body;

  if (!name || !code) {
    throw new ApiError(400, "Room name and code are required");
  }

  const room = {
    _id: _objectId(),
    name,
    code,
    session,
    section,
    instructor: req.user._id,
    membersCount: 1,
    coverImage: "https://placehold.co/600x200?text=Classroom",
    createdAt: new Date().toISOString(),
  };

  return res
    .status(201)
    .json(new ApiResponse(201, { room }, "Classroom created successfully"));
});

// 🚀 5. GET ROOM DETAILS
const getRoomDetails = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const room = {
    _id: roomId,
    name: "CSE 101: Introduction to Computer Systems",
    code: "CSE101",
    session: "2023-24",
    section: "A",
    instructor: {
      _id: "u_teacher_1",
      fullName: "Dr. Anisul Islam",
      userName: "anisul_sir",
      avatar: "https://ui-avatars.com/api/?name=Anisul+Islam",
    },
    membersCount: 45,
    coverImage: "https://placehold.co/600x200?text=Classroom",
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
  };

  return res
    .status(200)
    .json(new ApiResponse(200, { room }, "Room details fetched"));
});

export { getRoomFeed, createRoomPost, getMyRooms, createRoom, getRoomDetails };
