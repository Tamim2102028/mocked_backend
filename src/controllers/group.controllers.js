import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Group } from "../models/group.model.js";
import { createGroupService } from "../services/group.service.js";
import { uploadFile } from "../utils/cloudinaryFileUpload.js";

// 1. CREATE GROUP
const createGroup = asyncHandler(async (req, res) => {
  let { name, description, type, privacy, settings } = req.body;

  // Handle Image Uploads
  let avatar = "";
  let coverImage = "";

  if (req.files) {
    // Avatar
    if (req.files.avatar && req.files.avatar[0]) {
      const uploadResult = await uploadFile(req.files.avatar[0].path);
      if (uploadResult) {
        avatar = uploadResult.secure_url;
      }
    }
    // Cover Image
    if (req.files.coverImage && req.files.coverImage[0]) {
      const uploadResult = await uploadFile(req.files.coverImage[0].path);
      if (uploadResult) {
        coverImage = uploadResult.secure_url;
      }
    }
  }

  if (!name) {
    throw new ApiError(400, "Group name is required");
  }

  // Parse settings if it's a string (FormData sends objects as JSON strings)
  if (typeof settings === "string") {
    try {
      settings = JSON.parse(settings);
    } catch (error) {
      settings = {
        allowMemberPosting: true,
        requirePostApproval: false,
      };
    }
  }

  const group = await createGroupService({
    name,
    description,
    type,
    privacy,
    settings,
    avatar,
    coverImage,
    creatorId: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { group }, "Group created successfully"));
});

// 2. GET MY GROUPS
const getMyGroups = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { groups: [] }, "My groups fetched"));
});

// 3. GET UNIVERSITY GROUPS
const getUniversityGroups = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { groups: [] }, "University groups fetched"));
});

// 4. GET CAREER GROUPS
const getCareerGroups = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { groups: [] }, "Career groups fetched"));
});

// 5. GET SUGGESTED GROUPS
const getSuggestedGroups = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { groups: [] }, "Suggested groups fetched"));
});

// 6. GET SENT REQUESTS
const getSentRequestsGroups = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { groups: [] }, "Sent requests fetched"));
});

// 7. GET INVITED GROUPS
const getInvitedGroups = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { groups: [] }, "Invited groups fetched"));
});

// 8. GET GROUP DETAILS
const getGroupDetails = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const group = await Group.findOne({ slug });

  if (!group) {
    throw new ApiError(404, "Group not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { group }, "Group details fetched"));
});

// 9. GET GROUP FEED
const getGroupFeed = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { posts: [] }, "Group feed fetched"));
});

// 10. CREATE GROUP POST
const createGroupPost = asyncHandler(async (req, res) => {
  return res
    .status(201)
    .json(new ApiResponse(201, { post: {} }, "Group post created"));
});

// 11. JOIN GROUP
const joinGroup = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { status: "REQUESTED" }, "Join request sent"));
});

// 12. CANCEL JOIN REQUEST
const cancelJoinRequest = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, { status: "CANCELLED" }, "Join request cancelled")
    );
});

// 13. ACCEPT JOIN REQUEST
const acceptJoinRequest = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, { status: "ACCEPTED" }, "Join request accepted")
    );
});

// 14. REJECT JOIN REQUEST
const rejectJoinRequest = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, { status: "REJECTED" }, "Join request rejected")
    );
});

// 15. LEAVE GROUP
const leaveGroup = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { status: "LEFT" }, "Left group successfully"));
});

export {
  createGroup,
  getMyGroups,
  getUniversityGroups,
  getCareerGroups,
  getSuggestedGroups,
  getSentRequestsGroups,
  getInvitedGroups,
  getGroupDetails,
  getGroupFeed,
  createGroupPost,
  joinGroup,
  cancelJoinRequest,
  acceptJoinRequest,
  rejectJoinRequest,
  leaveGroup,
};
