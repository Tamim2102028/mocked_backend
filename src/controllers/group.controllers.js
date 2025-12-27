import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  createGroupService,
  getMyGroupsService,
  getUniversityGroupsService,
  getCareerGroupsService,
  getSuggestedGroupsService,
  getSentRequestsGroupsService,
  getInvitedGroupsService,
  joinGroupService,
  leaveGroupService,
  cancelJoinRequestService,
  acceptJoinRequestService,
  rejectJoinRequestService,
  getGroupDetailsService,
  getGroupMembersService,
  removeMemberService,
  assignAdminService,
  revokeAdminService,
  getGroupFeedService,
  createGroupPostService,
} from "../services/group.service.js";
import {
  toggleLikePostService,
  toggleMarkAsReadService,
  deletePostService,
  updatePostService,
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

  const result = await createGroupService(
    req.body,
    req.user._id,
    avatarLocalPath,
    coverImageLocalPath
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Group created successfully"));
});

// ==========================================
// 🚀 2. GET MY GROUPS
// ==========================================
const getMyGroups = asyncHandler(async (req, res) => {
  const groups = await getMyGroupsService(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, groups, "My groups fetched successfully"));
});

// ==========================================
// 🚀 3. GET UNIVERSITY GROUPS
// ==========================================
const getUniversityGroups = asyncHandler(async (req, res) => {
  const groups = await getUniversityGroupsService(req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, groups, "University groups fetched successfully")
    );
});

// ==========================================
// 🚀 4. GET CAREER GROUPS
// ==========================================
const getCareerGroups = asyncHandler(async (req, res) => {
  const groups = await getCareerGroupsService(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, groups, "Career groups fetched successfully"));
});

// ==========================================
// 🚀 5. GET SUGGESTED GROUPS
// ==========================================
const getSuggestedGroups = asyncHandler(async (req, res) => {
  const groups = await getSuggestedGroupsService(req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, groups, "Suggested groups fetched successfully")
    );
});

// ==========================================
// 🚀 6. GET SENT REQUESTS
// ==========================================
const getSentRequestsGroups = asyncHandler(async (req, res) => {
  const groups = await getSentRequestsGroupsService(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, groups, "Sent requests fetched successfully"));
});

// ==========================================
// 🚀 7. GET INVITED GROUPS
// ==========================================
const getInvitedGroups = asyncHandler(async (req, res) => {
  const groups = await getInvitedGroupsService(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, groups, "Invited groups fetched successfully"));
});

// ==========================================
// 🚀 8. JOIN GROUP
// ==========================================
const joinGroup = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const result = await joinGroupService(slug, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Join request sent successfully"));
});

// ==========================================
// 🚀 9. LEAVE GROUP
// ==========================================
const leaveGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const result = await leaveGroupService(groupId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Left group successfully"));
});

// ==========================================
// 🚀 10. CANCEL JOIN REQUEST
// ==========================================
const cancelJoinRequest = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const result = await cancelJoinRequestService(slug, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Join request cancelled successfully"));
});

// ==========================================
// 🚀 11. ACCEPT JOIN REQUEST (Admin Only)
// ==========================================
const acceptJoinRequest = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { userId } = req.body;

  const result = await acceptJoinRequestService(slug, req.user._id, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "User request accepted"));
});

// ==========================================
// 🚀 12. REJECT JOIN REQUEST (Admin Only)
// ==========================================
const rejectJoinRequest = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { userId } = req.body;

  const result = await rejectJoinRequestService(slug, req.user._id, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "User request rejected"));
});

// ==========================================
// 🚀 13. GET GROUP DETAILS
// ==========================================
const getGroupDetails = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const result = await getGroupDetailsService(slug, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Group details fetched successfully"));
});

// ==========================================
// 🚀 14. GET GROUP MEMBERS
// ==========================================
const getGroupMembers = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const result = await getGroupMembersService(groupId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Group members fetched successfully"));
});

// ==========================================
// 🚀 15. REMOVE MEMBER (Admin Only)
// ==========================================
const removeMember = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const result = await removeMemberService(groupId, req.user._id, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Member removed successfully"));
});

// ==========================================
// 🚀 16. ASSIGN ADMIN (Owner/Admin Only)
// ==========================================
const assignAdmin = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const result = await assignAdminService(groupId, req.user._id, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Member promoted to admin"));
});

// ==========================================
// 🚀 17. REVOKE ADMIN (Owner Only)
// ==========================================
const revokeAdmin = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const result = await revokeAdminService(groupId, req.user._id, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Admin privileges revoked"));
});

// ==========================================
// 🚀 18. GET GROUP FEED
// ==========================================
const getGroupFeed = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const { posts, pagination } = await getGroupFeedService(
    slug,
    req.user._id,
    page,
    limit
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { posts, pagination }, "Group feed fetched"));
});

// ==========================================
// 🚀 19. CREATE GROUP POST
// ==========================================
const createGroupPost = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const postData = req.body;

  const { post, meta } = await createGroupPostService(
    slug,
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
  deleteGroupPost,
  updateGroupPost,
  getGroupPostComments,
  createGroupPostComment,
  deleteGroupPostComment,
  updateGroupPostComment,
  toggleGroupPostCommentLike,
};
