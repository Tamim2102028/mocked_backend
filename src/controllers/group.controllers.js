import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { groupServices, groupActions } from "../services/group.service.js";
import { GROUP_MEMBERSHIP_STATUS } from "../constants/index.js";
import {
  toggleLikePostService,
  toggleMarkAsReadService,
  deletePostService,
  updatePostService,
  togglePinPostService,
} from "../services/post.service.js";
import {
  getPostCommentsService,
  addCommentService,
  deleteCommentService,
  updateCommentService,
  toggleCommentLikeService,
} from "../services/comment.service.js";

// ==========================================
// 🚀 1. CREATE GROUP
// ==========================================
const createGroup = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  const { group, meta } = await groupActions.createGroupService(
    req.body,
    req.user._id,
    avatarLocalPath,
    coverImageLocalPath
  );

  return res
    .status(201)
    .json(new ApiResponse(201, { group, meta }, "Group created successfully"));
});

// ==========================================
// 🚀 2. GET MY GROUPS
// ==========================================
const getMyGroups = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { groups, pagination } = await groupServices.getMyGroupsService(
    req.user._id,
    page,
    limit
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { groups, pagination },
        "My groups fetched successfully"
      )
    );
});

// ==========================================
// 🚀 3. GET UNIVERSITY GROUPS
// ==========================================
const getUniversityGroups = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { groups, pagination } = await groupServices.getUniversityGroupsService(
    req.user._id,
    page,
    limit
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { groups, pagination },
        "University groups fetched successfully"
      )
    );
});

// ==========================================
// 🚀 4. GET CAREER GROUPS
// ==========================================
const getCareerGroups = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { groups, pagination } = await groupServices.getCareerGroupsService(
    req.user._id,
    page,
    limit
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { groups, pagination },
        "Career groups fetched successfully"
      )
    );
});

// ==========================================
// 🚀 5. GET SUGGESTED GROUPS
// ==========================================
const getSuggestedGroups = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { groups, pagination } = await groupServices.getSuggestedGroupsService(
    req.user._id,
    page,
    limit
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { groups, pagination },
        "Suggested groups fetched successfully"
      )
    );
});

// ==========================================
// 🚀 2. DELETE GROUP (Owner Only)
// ==========================================
const deleteGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { groupId: deletedGroupId } = await groupActions.deleteGroupService(
    groupId,
    req.user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { groupId: deletedGroupId },
        "Group deleted successfully"
      )
    );
});

// ==========================================
// 🚀 3. INVITE MEMBERS
// ==========================================
const inviteMembers = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { targetUserIds } = req.body; // Array of user IDs

  if (
    !targetUserIds ||
    !Array.isArray(targetUserIds) ||
    targetUserIds.length === 0
  ) {
    throw new ApiError(400, "targetUserIds array is required");
  }

  const { results } = await groupActions.inviteMembersService(
    groupId,
    req.user._id,
    targetUserIds
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { results }, "Invitations sent successfully"));
});

// ==========================================
// 🚀 4. GET MY GROUPS
// ==========================================
const getSentRequestsGroups = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { groups, pagination } =
    await groupServices.getSentRequestsGroupsService(req.user._id, page, limit);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { groups, pagination },
        "Sent requests fetched successfully"
      )
    );
});

// ==========================================
// 🚀 7. GET INVITED GROUPS
// ==========================================
const getInvitedGroups = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { groups, pagination } = await groupServices.getInvitedGroupsService(
    req.user._id,
    page,
    limit
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { groups, pagination },
        "Invited groups fetched successfully"
      )
    );
});

// ==========================================
// 🚀 8. JOIN GROUP
// ==========================================
const joinGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { status } = await groupActions.joinGroupService(groupId, req.user._id);

  // Choose an appropriate message depending on the resulting membership status
  let message = "Joined / request sent successfully";
  if (status === GROUP_MEMBERSHIP_STATUS.JOINED) {
    message = "You have joined the group";
  } else if (status === GROUP_MEMBERSHIP_STATUS.PENDING) {
    message = "Join request sent successfully";
  }

  return res.status(200).json(new ApiResponse(200, { status }, message));
});

// ==========================================
// 🚀 9. LEAVE GROUP
// ==========================================
const leaveGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { status } = await groupActions.leaveGroupService(
    groupId,
    req.user._id
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { status }, "Left group successfully"));
});

// ==========================================
// 🚀 10. CANCEL JOIN REQUEST
// ==========================================
const cancelJoinRequest = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { status } = await groupActions.cancelJoinRequestService(
    groupId,
    req.user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, { status }, "Join request cancelled successfully")
    );
});

// ==========================================
// 🚀 11. ACCEPT JOIN REQUEST (Admin Only)
// ==========================================
const acceptJoinRequest = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  const { status } = await groupActions.acceptJoinRequestService(
    groupId,
    req.user._id,
    userId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { status }, "User request accepted"));
});

// ==========================================
// 🚀 12. REJECT JOIN REQUEST (Admin Only)
// ==========================================
const rejectJoinRequest = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  const { status } = await groupActions.rejectJoinRequestService(
    groupId,
    req.user._id,
    userId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { status }, "User request rejected"));
});

// ==========================================
// 🚀 13. GET GROUP DETAILS
// ==========================================
const getGroupDetails = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { group, meta } = await groupServices.getGroupDetailsService(
    slug,
    req.user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { group, meta },
        "Group details fetched successfully"
      )
    );
});

// ==========================================
// 🚀 14. GET GROUP MEMBERS
// ==========================================
const getGroupMembers = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { members, pagination } = await groupServices.getGroupMembersService(
    groupId,
    req.user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { members, pagination },
        "Group members fetched successfully"
      )
    );
});

// ==========================================
// 🚀 15. REMOVE MEMBER (Admin Only)
// ==========================================
const removeMember = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const { memberId } = await groupActions.removeMemberService(
    groupId,
    userId,
    req.user._id
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { memberId }, "Member removed successfully"));
});

// ==========================================
// 🚀 16. ASSIGN ADMIN (Owner/Admin Only)
// ==========================================
const assignAdmin = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const { role } = await groupActions.assignAdminService(
    groupId,
    userId,
    req.user._id
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { role }, "Member promoted to admin"));
});

// ==========================================
// 🚀 17. REVOKE ADMIN (Owner Only)
// ==========================================
const revokeAdmin = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const { role } = await groupActions.revokeAdminService(
    groupId,
    userId,
    req.user._id
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { role }, "Admin privileges revoked"));
});

// ==========================================
// 🚀 18. GET GROUP FEED
// ==========================================
const getGroupFeed = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const { posts, pagination } = await groupServices.getGroupFeedService(
    groupId,
    req.user._id,
    page,
    limit
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { posts, pagination }, "Group feed fetched"));
});

// ==========================================
// 🚀 GET GROUP PINNED POSTS
// ==========================================
const getGroupPinnedPosts = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const { posts, pagination } = await groupServices.getGroupPinnedPostsService(
    groupId,
    req.user._id,
    page,
    limit
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, { posts, pagination }, "Group pinned posts fetched")
    );
});

// ==========================================
// 🚀 19. CREATE GROUP POST
// ==========================================
const createGroupPost = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const postData = req.body;

  const { post, meta } = await groupActions.createGroupPostService(
    groupId,
    req.user._id,
    postData
  );

  return res
    .status(201)
    .json(new ApiResponse(201, { post, meta }, "Group post created"));
});

// ==========================================
// 🚀 20. TOGGLE LIKE GROUP POST
// ==========================================
const toggleGroupPostLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const { isLiked } = await toggleLikePostService(postId, req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { isLiked }, isLiked ? "Post liked" : "Post unliked")
    );
});

// ==========================================
// 🚀 21. TOGGLE MARK AS READ
// ==========================================
const toggleGroupPostRead = asyncHandler(async (req, res) => {
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

// ==========================================
// 🚀 TOGGLE PIN GROUP POST (Admin/Owner only)
// ==========================================
const toggleGroupPostPin = asyncHandler(async (req, res) => {
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

// ==========================================
// 🚀 22. DELETE GROUP POST
// ==========================================
const deleteGroupPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const { postId: deletedPostId } = await deletePostService(
    postId,
    req.user._id
  );

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

// ==========================================
// 🚀 23. UPDATE GROUP POST
// ==========================================
const updateGroupPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const { post, meta } = await updatePostService(
    postId,
    req.user._id,
    req.body
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { post, meta }, "Post updated successfully"));
});

// ==========================================
// 🚀 24. GET POST COMMENTS
// ==========================================
const getGroupPostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const { comments, pagination } = await getPostCommentsService(
    postId,
    page,
    limit,
    req.user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { comments, pagination },
        "Comments fetched successfully"
      )
    );
});

// ==========================================
// 🚀 25. ADD COMMENT
// ==========================================
const createGroupPostComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const { comment, meta } = await addCommentService(
    postId,
    content,
    req.user._id
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, { comment, meta }, "Comment added successfully")
    );
});

// ==========================================
// 🚀 26. DELETE COMMENT
// ==========================================
const deleteGroupPostComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const { commentId: deletedCommentId } = await deleteCommentService(
    commentId,
    req.user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { commentId: deletedCommentId },
        "Comment deleted successfully"
      )
    );
});

// ==========================================
// 🚀 27. UPDATE COMMENT
// ==========================================
const updateGroupPostComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Content is required");
  }

  const { comment, meta } = await updateCommentService(
    commentId,
    content,
    req.user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, { comment, meta }, "Comment updated successfully")
    );
});

// ==========================================
// 🚀 28. TOGGLE COMMENT LIKE
// ==========================================
const toggleGroupPostCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const { isLiked } = await toggleCommentLikeService(commentId, req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isLiked },
        isLiked ? "Comment liked" : "Comment unliked"
      )
    );
});

export {
  createGroup,
  getMyGroups,
  getUniversityGroups,
  getCareerGroups,
  getSuggestedGroups,
  getSentRequestsGroups,
  getInvitedGroups,
  joinGroup,
  leaveGroup,
  cancelJoinRequest,
  acceptJoinRequest,
  rejectJoinRequest,
  getGroupDetails,
  getGroupMembers,
  removeMember,
  assignAdmin,
  revokeAdmin,
  getGroupFeed,
  createGroupPost,
  toggleGroupPostLike,
  toggleGroupPostRead,
  toggleGroupPostPin,
  deleteGroupPost,
  updateGroupPost,
  getGroupPinnedPosts,
  getGroupPostComments,
  createGroupPostComment,
  deleteGroupPostComment,
  updateGroupPostComment,
  toggleGroupPostCommentLike,
  deleteGroup,
  inviteMembers,
};
