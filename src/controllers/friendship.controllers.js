import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { FOLLOW_TARGET_MODELS, FRIENDSHIP_STATUS } from "../constants/index.js";
import { Friendship } from "../models/friendship.model.js";
import { User } from "../models/user.model.js";
import { Follow } from "../models/follow.model.js";

// ==============================================================================
// 🤝 1. GET FRIENDS LIST
// ==============================================================================
const getFriendsList = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  // Find all accepted friendships where user is involved
  const friendships = await Friendship.find({
    $or: [{ requester: currentUserId }, { recipient: currentUserId }],
    status: FRIENDSHIP_STATUS.ACCEPTED,
  }).populate("requester recipient", "fullName userName avatar academicInfo");

  // Format the response to return the *friend's* details
  const friends = friendships.map((f) => {
    const isRequester = f.requester._id.toString() === currentUserId.toString();
    const friend = isRequester ? f.recipient : f.requester;

    return {
      _id: friend._id,
      fullName: friend.fullName,
      userName: friend.userName,
      avatar: friend.avatar,
      academicInfo: friend.academicInfo,
      friendshipId: f._id,
    };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { friends }, "Friends list fetched"));
});

// ==============================================================================
// 📥 2. GET RECEIVED FRIEND REQUESTS
// ==============================================================================
const getReceivedRequests = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const requests = await Friendship.find({
    recipient: currentUserId,
    status: FRIENDSHIP_STATUS.PENDING,
  }).populate("requester", "fullName userName avatar");

  const formattedRequests = requests.map((req) => ({
    requestId: req._id,
    requester: req.requester,
    createdAt: req.createdAt,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { requests: formattedRequests },
        "Received requests fetched"
      )
    );
});

// ==============================================================================
// 📤 3. ACTIONS
// ==============================================================================

// ACTION 1: SEND FRIEND REQUEST (auto follow)
const sendFriendRequest = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.user._id;

  if (targetUserId === currentUserId.toString()) {
    throw new ApiError(400, "You cannot send friend request to yourself");
  }

  // Check if user exists
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  // Check existing relationship
  const existingFriendship = await Friendship.findOne({
    $or: [
      { requester: currentUserId, recipient: targetUserId },
      { requester: targetUserId, recipient: currentUserId },
    ],
  });

  if (existingFriendship) {
    if (existingFriendship.status === FRIENDSHIP_STATUS.ACCEPTED) {
      throw new ApiError(400, "You are already friends");
    }
    if (existingFriendship.status === FRIENDSHIP_STATUS.PENDING) {
      if (
        existingFriendship.requester.toString() === currentUserId.toString()
      ) {
        throw new ApiError(400, "Friend request already sent");
      } else {
        throw new ApiError(400, "You have a pending request from this user");
      }
    }
    if (existingFriendship.status === FRIENDSHIP_STATUS.BLOCKED) {
      throw new ApiError(400, "You cannot send request to this user");
    }
  }

  // Create new request
  const newFriendship = await Friendship.create({
    requester: currentUserId,
    recipient: targetUserId,
    status: FRIENDSHIP_STATUS.PENDING,
  });

  // ✅ Auto-follow on friend request
  // Check if already following
  const existingFollow = await Follow.findOne({
    follower: currentUserId,
    following: targetUserId,
    followingModel: FOLLOW_TARGET_MODELS.USER,
  });

  if (!existingFollow) {
    await Follow.create({
      follower: currentUserId,
      following: targetUserId,
      followingModel: FOLLOW_TARGET_MODELS.USER,
    });
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        status: FRIENDSHIP_STATUS.PENDING,
        recipientId: targetUserId,
        friendshipId: newFriendship._id,
      },
      "Friend request sent"
    )
  );
});

// ACTION 2: ACCEPT FRIEND REQUEST
const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { userId: requesterId } = req.params; // The user who sent the request
  const currentUserId = req.user._id;

  const friendship = await Friendship.findOne({
    requester: requesterId,
    recipient: currentUserId,
    status: FRIENDSHIP_STATUS.PENDING,
  });

  if (!friendship) {
    throw new ApiError(404, "Friend request not found");
  }

  friendship.status = FRIENDSHIP_STATUS.ACCEPTED;
  await friendship.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: FRIENDSHIP_STATUS.ACCEPTED,
        requesterId,
        friendshipId: friendship._id,
      },
      "Friend request accepted"
    )
  );
});

// ACTION 3: REJECT A RECEIVED REQUEST
const rejectReceivedRequest = asyncHandler(async (req, res) => {
  const { userId: requesterId } = req.params;
  const currentUserId = req.user._id;

  const friendship = await Friendship.findOneAndDelete({
    requester: requesterId,
    recipient: currentUserId,
    status: FRIENDSHIP_STATUS.PENDING,
  });

  if (!friendship) {
    throw new ApiError(404, "Friend request not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { requesterId }, "Friend request rejected"));
});

// ACTION 4: CANCEL A SENT REQUEST
const cancelSentRequest = asyncHandler(async (req, res) => {
  const { userId: recipientId } = req.params;
  const currentUserId = req.user._id;

  const friendship = await Friendship.findOneAndDelete({
    requester: currentUserId,
    recipient: recipientId,
    status: FRIENDSHIP_STATUS.PENDING,
  });

  if (!friendship) {
    throw new ApiError(404, "Sent request not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { recipientId }, "Friend request cancelled"));
});

// ACTION 5: UNFRIEND A USER
const unfriendUser = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.user._id;

  const friendship = await Friendship.findOneAndDelete({
    $or: [
      { requester: currentUserId, recipient: targetUserId },
      { requester: targetUserId, recipient: currentUserId },
    ],
    status: FRIENDSHIP_STATUS.ACCEPTED,
  });

  if (!friendship) {
    throw new ApiError(404, "Friendship not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { userId: targetUserId }, "Unfriended successfully")
    );
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
