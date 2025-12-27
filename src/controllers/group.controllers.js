import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  createGroupService,
  leaveGroupService,
  joinGroupService,
  cancelJoinRequestService,
  acceptJoinRequestService,
  rejectJoinRequestService,
  removeMemberService,
  assignAdminService,
  revokeAdminService,
  getMyGroupsService,
  getUniversityGroupsService,
  getCareerGroupsService,
  getSuggestedGroupsService,
  getSentRequestsGroupsService,
  getInvitedGroupsService,
  getGroupDetailsService,
  getGroupMembersService,
} from "../services/group.service.js";

// 1. CREATE GROUP
const createGroup = asyncHandler(async (req, res) => {
  let { name, description, type, privacy, settings } = req.body;

  if (!name) {
    throw new ApiError(400, "Group name is required");
  }

  const { group, meta } = await createGroupService({
    name,
    description,
    type,
    privacy,
    settings,
    files: req.files,
    creatorId: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { group, meta }, "Group created successfully"));
});

// 2. GET MY GROUPS
const getMyGroups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const { groups, pagination } = await getMyGroupsService(
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

// 3. GET UNIVERSITY GROUPS
const getUniversityGroups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const { groups, pagination } = await getUniversityGroupsService(
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

// 4. GET CAREER GROUPS
const getCareerGroups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const { groups, pagination } = await getCareerGroupsService(
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

// 5. GET SUGGESTED GROUPS
const getSuggestedGroups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const { groups, pagination } = await getSuggestedGroupsService(
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

// 6. GET SENT REQUESTS
const getSentRequestsGroups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const { groups, pagination } = await getSentRequestsGroupsService(
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
        "Sent requests fetched successfully"
      )
    );
});

// 7. GET INVITED GROUPS
const getInvitedGroups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const { groups, pagination } = await getInvitedGroupsService(
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

// 8. GET GROUP DETAILS
const getGroupDetails = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const { group, meta } = await getGroupDetailsService(slug, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, { group, meta }, "Group details fetched"));
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
  const { slug } = req.params;

  const { status } = await joinGroupService(slug, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, { status }, "Join request processed"));
});

// 12. CANCEL JOIN REQUEST
const cancelJoinRequest = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const { status } = await cancelJoinRequestService(slug, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, { status }, "Join request cancelled"));
});

// 13. ACCEPT JOIN REQUEST
const acceptJoinRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const { status } = await acceptJoinRequestService(requestId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, { status }, "Join request accepted"));
});

// 14. REJECT JOIN REQUEST
const rejectJoinRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const { status } = await rejectJoinRequestService(requestId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, { status }, "Join request rejected"));
});

// 15. LEAVE GROUP
const leaveGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const { status } = await leaveGroupService(groupId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, { status }, "Successfully left the group"));
});

// 16. REMOVE MEMBER
const removeMember = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const { memberId } = await removeMemberService(groupId, userId, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, { memberId }, "Member removed successfully"));
});

// 17. ASSIGN ADMIN
const assignAdmin = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const { role } = await assignAdminService(groupId, userId, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, { role }, "Member promoted to Admin"));
});

// 18. REVOKE ADMIN
const revokeAdmin = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const { role } = await revokeAdminService(groupId, userId, req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, { role }, "Admin rights revoked"));
});

// 19. GET GROUP MEMBERS
const getGroupMembers = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const { members, pagination } = await getGroupMembersService(
    groupId,
    page,
    limit
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { members, pagination },
        "Members fetched successfully"
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
  getGroupDetails,
  getGroupFeed,
  createGroupPost,
  joinGroup,
  cancelJoinRequest,
  acceptJoinRequest,
  rejectJoinRequest,
  leaveGroup,
  removeMember,
  assignAdmin,
  revokeAdmin,
  getGroupMembers,
};
