import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { createPostService } from "../services/post.service.js";
import { Group } from "../models/group.model.js";
import { GroupMembership } from "../models/groupMembership.model.js";
import { User } from "../models/user.model.js";

import {
  POST_TARGET_MODELS,
  GROUP_ROLES,
  GROUP_MEMBERSHIP_STATUS,
} from "../constants/index.js";
import { Department } from "../models/department.model.js";
import { Institution } from "../models/institution.model.js";

const createPost = asyncHandler(async (req, res) => {
  const { postOnModel, postOnId } = req.body;
  const userId = req.user._id;

  if (!postOnModel || !postOnId) {
    throw new ApiError(400, "postOnModel and postOnId are required");
  }

  // Handle Group Specific Logic
  if (postOnModel === POST_TARGET_MODELS.GROUP) {
    // 1. Find Group (Verify it exists)
    const group = await Group.findById(postOnId);
    if (!group) {
      throw new ApiError(404, "Group not found");
    }

    // 2. Check Membership
    const membership = await GroupMembership.findOne({
      group: postOnId,
      user: userId,
      status: GROUP_MEMBERSHIP_STATUS.JOINED,
    });

    if (!membership) {
      throw new ApiError(403, "You must be a member to post in this group");
    }

    // 3. Check Settings (Allow Member Posting)
    if (
      membership.role === GROUP_ROLES.MEMBER &&
      group.settings?.allowMemberPosting === false
    ) {
      throw new ApiError(403, "Posting is disabled for members in this group");
    }
  }

  // Handle User (Profile) Specific Logic
  if (postOnModel === POST_TARGET_MODELS.USER) {
    if (postOnId.toString() !== userId.toString()) {
      throw new ApiError(403, "You can only post on your own profile");
    }
  }

  // Create Post using common service
  const { post, meta } = await createPostService(req.body, userId);

  // Post-Creation Actions
  if (postOnModel === POST_TARGET_MODELS.GROUP) {
    await Group.findByIdAndUpdate(postOnId, { $inc: { postsCount: 1 } });
  } else if (postOnModel === POST_TARGET_MODELS.USER) {
    await User.findByIdAndUpdate(postOnId, { $inc: { postsCount: 1 } });
  } else if (postOnModel === POST_TARGET_MODELS.DEPARTMENT) {
    await Department.findByIdAndUpdate(postOnId, { $inc: { postsCount: 1 } });
  } else if (postOnModel === POST_TARGET_MODELS.INSTITUTION) {
    await Institution.findByIdAndUpdate(postOnId, { $inc: { postsCount: 1 } });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { post, meta }, "Post created successfully"));
});

export { createPost };
