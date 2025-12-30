import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  createPostService,
  toggleLikePostService,
  toggleMarkAsReadService,
  deletePostService,
  updatePostService,
  togglePinPostService,
} from "../../services/common/post.service.js";
import { Group } from "../../models/group.model.js";
import { GroupMembership } from "../../models/groupMembership.model.js";
import { User } from "../../models/user.model.js";

import {
  POST_TARGET_MODELS,
  GROUP_ROLES,
  GROUP_MEMBERSHIP_STATUS,
} from "../../constants/index.js";
import { Department } from "../../models/department.model.js";
import { Institution } from "../../models/institution.model.js";

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
    const groupUpdate = await Group.findByIdAndUpdate(postOnId, {
      $inc: { postsCount: 1 },
    });
    if (!groupUpdate) {
      throw new ApiError(500, "Failed to update group posts count");
    }
  } else if (postOnModel === POST_TARGET_MODELS.USER) {
    const userUpdate = await User.findByIdAndUpdate(postOnId, {
      $inc: { postsCount: 1 },
    });
    if (!userUpdate) {
      throw new ApiError(500, "Failed to update user profile posts count");
    }
  } else if (postOnModel === POST_TARGET_MODELS.DEPARTMENT) {
    const deptUpdate = await Department.findByIdAndUpdate(postOnId, {
      $inc: { postsCount: 1 },
    });
    if (!deptUpdate) {
      throw new ApiError(500, "Failed to update department posts count");
    }
  } else if (postOnModel === POST_TARGET_MODELS.INSTITUTION) {
    const instUpdate = await Institution.findByIdAndUpdate(postOnId, {
      $inc: { postsCount: 1 },
    });
    if (!instUpdate) {
      throw new ApiError(500, "Failed to update institution posts count");
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { post, meta }, "Post created successfully"));
});

// Toggle Like
const togglePostLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { isLiked, likesCount } = await toggleLikePostService(
    postId,
    req.user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isLiked, likesCount },
        isLiked ? "Post liked" : "Post unliked"
      )
    );
});

// Toggle Mark as Read
const togglePostRead = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { isRead } = await toggleMarkAsReadService(postId, req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isRead },
        isRead ? "Marked as read" : "Marked as unread"
      )
    );
});

// Delete Post
const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { postId: deletedPostId } = await deletePostService(
    postId,
    req.user._id
  );

  if (!deletedPostId) {
    throw new ApiError(500, "Deletion failed at service layer");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { postId: deletedPostId },
        "Post deleted successfully"
      )
    );
});

// Update Post
const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { post, meta } = await updatePostService(
    postId,
    req.user._id,
    req.body
  );

  if (!post) {
    throw new ApiError(404, "Post not found or update failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { post, meta }, "Post updated successfully"));
});

// Toggle Pin
const togglePostPin = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { post, meta } = await togglePinPostService(postId, req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { post, meta },
        post.isPinned ? "Post pinned" : "Post unpinned"
      )
    );
});

export {
  createPost,
  togglePostLike,
  togglePostRead,
  deletePost,
  updatePost,
  togglePostPin,
};
