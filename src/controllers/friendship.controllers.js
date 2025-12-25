import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { FOLLOW_TARGET_MODELS, FRIENDSHIP_STATUS } from "../constants/index.js";
import { Friendship } from "../models/friendship.model.js";
import { User } from "../models/user.model.js";
import { Follow } from "../models/follow.model.js";

// Helper to format user response
const mapUserToResponse = (
  user,
  friendshipStatus,
  friendshipId = undefined
) => {
  if (!user) return null;
  return {
    _id: user._id,
    userName: user.userName,
    fullName: user.fullName,
    avatar: user.avatar,
    institution: user.institution || null,
    userType: user.userType,
    department: user.academicInfo?.department || null,
    friendshipStatus,
    friendshipId,
  };
};

// ==============================================================================
// 🤝 1. GET FRIENDS LIST
// ==============================================================================
const getFriendsList = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  // Find all accepted friendships where current user is involved
  const friendships = await Friendship.find({
    $or: [{ requester: currentUserId }, { recipient: currentUserId }],
    status: FRIENDSHIP_STATUS.ACCEPTED,
  }).populate({
    path: "requester recipient",
    select: "fullName userName avatar academicInfo userType institution",
    populate: [
      { path: "institution", select: "name" },
      { path: "academicInfo.department", select: "name" },
    ],
  });

  // Format the response
  const friends = friendships
    .map((f) => {
      // Safety check: if either user is deleted/null, skip this friendship
      if (!f.requester || !f.recipient) return null;

      const isRequester =
        f.requester._id.toString() === currentUserId.toString();
      const friend = isRequester ? f.recipient : f.requester;
      return mapUserToResponse(friend, "accepted", f._id);
    })
    .filter(Boolean);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalCount: friends.length,
        users: friends,
      },
      "Friends list fetched successfully"
    )
  );
});

// ==============================================================================
// 📥 2. GET RECEIVED FRIEND REQUESTS
// ==============================================================================
const getReceivedRequests = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const requests = await Friendship.find({
    recipient: currentUserId,
    status: FRIENDSHIP_STATUS.PENDING,
  }).populate({
    path: "requester",
    select: "fullName userName avatar academicInfo userType institution",
    populate: [
      { path: "institution", select: "name" },
      { path: "academicInfo.department", select: "name" },
    ],
  });

  const formattedRequests = requests
    .map((req) => {
      // Safety check: if requester is deleted/null, skip this request
      if (!req.requester) return null;
      return mapUserToResponse(req.requester, "incoming_request", req._id);
    })
    .filter(Boolean);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalCount: formattedRequests.length,
        users: formattedRequests,
      },
      "Received requests fetched"
    )
  );
});

// ==============================================================================
// 📤 3. GET SENT FRIEND REQUESTS
// ==============================================================================
const getSentRequests = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const requests = await Friendship.find({
    requester: currentUserId,
    status: FRIENDSHIP_STATUS.PENDING,
  }).populate({
    path: "recipient",
    select: "fullName userName avatar academicInfo userType institution",
    populate: [
      { path: "institution", select: "name" },
      { path: "academicInfo.department", select: "name" },
    ],
  });

  const formattedRequests = requests
    .map((req) => {
      // Safety check: if recipient is deleted/null, skip this request
      if (!req.recipient) return null;
      return mapUserToResponse(req.recipient, "outgoing_request", req._id);
    })
    .filter(Boolean);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalCount: formattedRequests.length,
        users: formattedRequests,
      },
      "Sent requests fetched"
    )
  );
});

// ==============================================================================
// 💡 4. GET SUGGESTIONS
// ==============================================================================
const getSuggestions = asyncHandler(async (req, res) => {
  // Temporary empty response as per user instruction
  const formattedSuggestions = [];

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalCount: formattedSuggestions.length,
        users: formattedSuggestions,
      },
      "Suggestions fetched"
    )
  );
});

// ==============================================================================
// ⚡ ACTIONS
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
      if (
        existingFriendship.requester.toString() === currentUserId.toString()
      ) {
        throw new ApiError(400, "You have blocked this user. Unblock first.");
      } else {
        throw new ApiError(400, "You are blocked by this user");
      }
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

// ACTION 6: BLOCK USER
const blockUser = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.user._id;

  if (targetUserId === currentUserId.toString()) {
    throw new ApiError(400, "You cannot block yourself");
  }

  // 1. Check if a block relation already exists
  const existingBlock = await Friendship.findOne({
    $or: [
      { requester: currentUserId, recipient: targetUserId },
      { requester: targetUserId, recipient: currentUserId },
    ],
    status: FRIENDSHIP_STATUS.BLOCKED,
  });

  if (existingBlock) {
    if (existingBlock.requester.toString() === currentUserId.toString()) {
      // Already blocked by me, just return success
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { blockRelation: existingBlock },
            "User already blocked"
          )
        );
    } else {
      // I am blocked by the target user. I cannot block them back.
      throw new ApiError(400, "You are blocked by this user");
    }
  }

  // 2. Remove any existing friendship/request (Accepted or Pending)
  await Friendship.findOneAndDelete({
    $or: [
      { requester: currentUserId, recipient: targetUserId },
      { requester: targetUserId, recipient: currentUserId },
    ],
    status: { $ne: FRIENDSHIP_STATUS.BLOCKED },
  });

  // 3. Remove any existing follows (both ways)
  await Follow.deleteMany({
    $or: [
      { follower: currentUserId, following: targetUserId },
      { follower: targetUserId, following: currentUserId },
    ],
  });

  // 4. Create Block relationship
  const blockRelation = await Friendship.create({
    requester: currentUserId,
    recipient: targetUserId,
    status: FRIENDSHIP_STATUS.BLOCKED,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { blockRelation }, "User blocked successfully"));
});

// ACTION 7: UNBLOCK USER
const unblockUser = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.user._id;

  const blockRelation = await Friendship.findOneAndDelete({
    requester: currentUserId,
    recipient: targetUserId,
    status: FRIENDSHIP_STATUS.BLOCKED,
  });

  if (!blockRelation) {
    throw new ApiError(404, "Block relationship not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { userId: targetUserId },
        "User unblocked successfully"
      )
    );
});

export {
  getFriendsList,
  getReceivedRequests,
  getSentRequests,
  getSuggestions,
  sendFriendRequest,
  acceptFriendRequest,
  rejectReceivedRequest,
  cancelSentRequest,
  unfriendUser,
  blockUser,
  unblockUser,
};
