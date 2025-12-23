import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { FRIENDSHIP_STATUS } from "../constants/index.js";
import mongoose from "mongoose";

// ==============================================================================
// 🤝 1. GET FRIENDS LIST (যাদের সাথে আমার কানেকশন আছে)
// ==============================================================================
const getFriendsList = asyncHandler(async (req, res) => {
  // Mock Data: এরা আমার বন্ধু (status: ACCEPTED)
  const friends = [
    {
      _id: "u_101",
      fullName: "Sadia Islam",
      userName: "sadia_codes",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sadia",
      academicInfo: {
        department: { name: "CSE" },
        session: "2021-22",
      },
      friendshipId: "friendship_1", // Unfriend করার জন্য এই আইডি লাগবে
    },
    {
      _id: "u_102",
      fullName: "Rahim Ahmed",
      userName: "rahim_dev",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahim",
      academicInfo: {
        department: { name: "EEE" },
        session: "2021-22",
      },
      friendshipId: "friendship_2",
    },
  ];

  return res
    .status(200)
    .json(new ApiResponse(200, { friends }, "Friends list fetched"));
});

// ==============================================================================
// 📥 2. GET RECEIVED FRIEND REQUESTS (অন্যরা আমাকে পাঠিয়েছে)
// ==============================================================================
const getReceivedRequests = asyncHandler(async (req, res) => {
  // Mock Data: এরা আমাকে রিকোয়েস্ট পাঠিয়েছে (status: PENDING)
  const requests = [
    {
      requestId: "request_id_1", // friendship document এর আইডি
      requester: {
        _id: "u_201",
        fullName: "Sumon Khan",
        userName: "sumon_k",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sumon",
      },
    },
  ];

  return res
    .status(200)
    .json(new ApiResponse(200, { requests }, "Received requests fetched"));
});

// ==============================================================================
// 📤 3. ACTIONS (Separated for Security & Clarity)
// ==============================================================================

// ACTION 1: SEND FRIEND REQUEST
const sendFriendRequest = asyncHandler(async (req, res) => {
  const { userId } = req.params; // যাকে রিকোয়েস্ট পাঠাচ্ছি

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        status: FRIENDSHIP_STATUS.PENDING,
        recipientId: userId,
      },
      "Friend request sent"
    )
  );
});

// ACTION 2: ACCEPT FRIEND REQUEST
const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: FRIENDSHIP_STATUS.ACCEPTED,
        requestId,
      },
      "Friend request accepted"
    )
  );
});

// ACTION 3: REJECT A RECEIVED REQUEST
const rejectReceivedRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  return res
    .status(200)
    .json(new ApiResponse(200, { requestId }, "Friend request rejected"));
});

// ACTION 4: CANCEL A SENT REQUEST
const cancelSentRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  return res
    .status(200)
    .json(new ApiResponse(200, { requestId }, "Friend request cancelled"));
});

// ACTION 5: UNFRIEND A USER
const unfriendUser = asyncHandler(async (req, res) => {
  const { friendshipId } = req.params;

  return res
    .status(200)
    .json(new ApiResponse(200, { friendshipId }, "Unfriended successfully"));
});

export {
  getFriendsList,
  getReceivedRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectReceivedRequest,
  cancelSentRequest,
  unfriendUser,
};
