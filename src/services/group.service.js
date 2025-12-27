import { Group } from "../models/group.model.js";
import { GroupMembership } from "../models/groupMembership.model.js";
import {
  GROUP_TYPES,
  GROUP_ROLES,
  GROUP_MEMBERSHIP_STATUS,
  GROUP_PRIVACY,
  GROUP_JOIN_METHOD,
  POST_TARGET_MODELS,
  REACTION_TARGET_MODELS,
} from "../constants/index.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadFile } from "../utils/cloudinaryFileUpload.js";
import { Post } from "../models/post.model.js";
import { ReadPost } from "../models/readPost.model.js";
import { Reaction } from "../models/reaction.model.js";
import { createPostService } from "./post.service.js";

const createGroupService = async ({
  name,
  description,
  type,
  privacy,
  settings,
  files,
  creatorId,
}) => {
  // Handle Image Uploads
  let avatar = "";
  let coverImage = "";

  if (files) {
    // Avatar
    if (files.avatar && files.avatar[0]) {
      const uploadResult = await uploadFile(files.avatar[0].path);
      if (uploadResult) {
        avatar = uploadResult.secure_url;
      }
    }
    // Cover Image
    if (files.coverImage && files.coverImage[0]) {
      const uploadResult = await uploadFile(files.coverImage[0].path);
      if (uploadResult) {
        coverImage = uploadResult.secure_url;
      }
    }
  }

  // Parse settings if it's a string (FormData sends objects as JSON strings)
  let parsedSettings = settings;
  if (typeof settings === "string") {
    try {
      parsedSettings = JSON.parse(settings);
    } catch (error) {
      parsedSettings = {
        allowMemberPosting: true,
        requirePostApproval: false,
      };
    }
  }

  // Generate unique slug
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = baseSlug;
  let isSlugUnique = false;

  // First check with base slug
  let existingGroup = await Group.findOne({ slug });
  if (!existingGroup) {
    isSlugUnique = true;
  }

  // If base slug exists, append timestamp
  if (!isSlugUnique) {
    slug = `${baseSlug}-${Date.now()}`;
    existingGroup = await Group.findOne({ slug });
    if (!existingGroup) {
      isSlugUnique = true;
    }
  }

  // If even with timestamp it exists (extremely unlikely), loop to find one
  while (!isSlugUnique) {
    slug = `${baseSlug}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    existingGroup = await Group.findOne({ slug });
    if (!existingGroup) {
      isSlugUnique = true;
    }
  }

  // Create Group
  const group = await Group.create({
    name,
    slug,
    description: description || "",
    type: type || GROUP_TYPES.GENERAL,
    privacy: privacy || GROUP_PRIVACY.PUBLIC,
    creator: creatorId,
    owner: creatorId,
    membersCount: 1,
    avatar:
      avatar ||
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&auto=format&fit=crop&q=60", // Open Book on White Background
    settings: parsedSettings || {},
    coverImage:
      coverImage ||
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=60", // Study Desk/Books
  });

  if (!group) {
    throw new ApiError(500, "Failed to create group");
  }

  // Add Creator as Member (OWNER)
  await GroupMembership.create({
    group: group._id,
    user: creatorId,
    role: GROUP_ROLES.OWNER,
    status: GROUP_MEMBERSHIP_STATUS.JOINED,
    joinedAt: new Date(),
  });

  const meta = {
    status: GROUP_MEMBERSHIP_STATUS.JOINED,
    isMember: true,
    isAdmin: true, // Owner is admin
  };

  return { group, meta };
};

// === Leave Group Service ===
const leaveGroupService = async (groupId, userId) => {
  // 1. Check if group exists
  const group = await Group.findById(groupId);
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  // 2. Check membership
  const membership = await GroupMembership.findOne({
    group: groupId,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(404, "You are not a member of this group");
  }

  // 3. Check if Owner
  if (membership.role === GROUP_ROLES.OWNER) {
    throw new ApiError(
      400,
      "Owner cannot leave the group. Please transfer ownership first."
    );
  }

  // 4. Remove membership (Admin or Member)
  // If Admin leaves, they lose admin rights automatically as membership is gone
  await GroupMembership.findByIdAndDelete(membership._id);

  // 5. Decrement member count
  await Group.findByIdAndUpdate(groupId, {
    $inc: { membersCount: -1 },
  });

  return {
    status: GROUP_MEMBERSHIP_STATUS.NOT_JOINED,
  };
};

const joinGroupService = async (slug, userId) => {
  const group = await Group.findOne({ slug });
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const groupId = group._id;

  // Check if already a member or pending
  const existingMembership = await GroupMembership.findOne({
    group: groupId,
    user: userId,
  });

  if (existingMembership) {
    if (existingMembership.status === GROUP_MEMBERSHIP_STATUS.JOINED) {
      throw new ApiError(400, "Already a member of this group");
    }
    if (existingMembership.status === GROUP_MEMBERSHIP_STATUS.PENDING) {
      throw new ApiError(400, "Join request already sent");
    }
    if (existingMembership.status === GROUP_MEMBERSHIP_STATUS.BANNED) {
      throw new ApiError(403, "You are banned from this group");
    }
    if (existingMembership.status === GROUP_MEMBERSHIP_STATUS.INVITED) {
      // If invited, auto-accept
      existingMembership.status = GROUP_MEMBERSHIP_STATUS.JOINED;
      existingMembership.joinedAt = new Date();
      existingMembership.joinMethod = GROUP_JOIN_METHOD.INVITE;
      await existingMembership.save();
      await Group.findByIdAndUpdate(groupId, { $inc: { membersCount: 1 } });
      return { status: GROUP_MEMBERSHIP_STATUS.JOINED };
    }
  }

  // Logic for Public vs Private Group
  let status = GROUP_MEMBERSHIP_STATUS.PENDING;
  let joinedAt = undefined;
  let joinMethod = GROUP_JOIN_METHOD.REQUEST_APPROVAL;

  if (group.privacy === GROUP_PRIVACY.PUBLIC) {
    status = GROUP_MEMBERSHIP_STATUS.JOINED;
    joinedAt = new Date();
    joinMethod = GROUP_JOIN_METHOD.DIRECT_JOIN;
    await Group.findByIdAndUpdate(groupId, { $inc: { membersCount: 1 } });
  }

  await GroupMembership.create({
    group: groupId,
    user: userId,
    status,
    role: GROUP_ROLES.MEMBER,
    joinedAt,
    joinMethod,
  });

  return { status };
};

const cancelJoinRequestService = async (slug, userId) => {
  const group = await Group.findOne({ slug });
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const membership = await GroupMembership.findOneAndDelete({
    group: group._id,
    user: userId,
    status: GROUP_MEMBERSHIP_STATUS.PENDING,
  });

  if (!membership) {
    throw new ApiError(404, "No pending request found to cancel");
  }

  return { status: GROUP_MEMBERSHIP_STATUS.NOT_JOINED };
};

const acceptJoinRequestService = async (requestId, adminId) => {
  // 1. Find Request
  const membership = await GroupMembership.findById(requestId).populate(
    "group",
    "membersCount"
  );
  if (!membership) {
    throw new ApiError(404, "Join request not found");
  }

  // 2. Validate Admin Permissions
  const adminMembership = await GroupMembership.findOne({
    group: membership.group._id,
    user: adminId,
    role: { $in: [GROUP_ROLES.OWNER, GROUP_ROLES.ADMIN] },
  });

  if (!adminMembership) {
    throw new ApiError(403, "You do not have permission to accept requests");
  }

  if (membership.status !== GROUP_MEMBERSHIP_STATUS.PENDING) {
    throw new ApiError(400, "This request is not pending");
  }

  // 3. Accept Request
  membership.status = GROUP_MEMBERSHIP_STATUS.JOINED;
  membership.joinedAt = new Date();
  await membership.save();

  // 4. Update Group Count
  await Group.findByIdAndUpdate(membership.group._id, {
    $inc: { membersCount: 1 },
  });

  return { status: GROUP_MEMBERSHIP_STATUS.JOINED };
};

const rejectJoinRequestService = async (requestId, adminId) => {
  // 1. Find Request
  const membership = await GroupMembership.findById(requestId);
  if (!membership) {
    throw new ApiError(404, "Join request not found");
  }

  // 2. Validate Admin Permissions
  const adminMembership = await GroupMembership.findOne({
    group: membership.group,
    user: adminId,
    role: { $in: [GROUP_ROLES.OWNER, GROUP_ROLES.ADMIN] },
  });

  if (!adminMembership) {
    throw new ApiError(403, "You do not have permission to reject requests");
  }

  if (membership.status !== GROUP_MEMBERSHIP_STATUS.PENDING) {
    throw new ApiError(400, "This request is not pending");
  }

  // 3. Reject (Delete) Request
  await GroupMembership.findByIdAndDelete(requestId);

  return { status: GROUP_MEMBERSHIP_STATUS.NOT_JOINED };
};

const removeMemberService = async (groupId, memberId, adminId) => {
  // 1. Validate Group
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  // 2. Validate Admin Permissions
  const adminMembership = await GroupMembership.findOne({
    group: groupId,
    user: adminId,
    role: { $in: [GROUP_ROLES.OWNER, GROUP_ROLES.ADMIN] },
  });
  if (!adminMembership) {
    throw new ApiError(403, "You do not have permission to remove members");
  }

  // 3. Validate Target Member
  const targetMembership = await GroupMembership.findOne({
    group: groupId,
    user: memberId,
  });
  if (!targetMembership) throw new ApiError(404, "Member not found");

  // 4. Prevent removing Owner
  if (targetMembership.role === GROUP_ROLES.OWNER) {
    throw new ApiError(400, "Cannot remove the group owner");
  }

  // 5. Prevent Admin removing another Admin (Only Owner can)
  if (
    targetMembership.role === GROUP_ROLES.ADMIN &&
    adminMembership.role !== GROUP_ROLES.OWNER
  ) {
    throw new ApiError(403, "Only the owner can remove admins");
  }

  // 6. Remove Member
  await GroupMembership.findByIdAndDelete(targetMembership._id);
  await Group.findByIdAndUpdate(groupId, { $inc: { membersCount: -1 } });

  return { memberId };
};

const assignAdminService = async (groupId, memberId, ownerId) => {
  // 1. Verify Owner
  const ownerMembership = await GroupMembership.findOne({
    group: groupId,
    user: ownerId,
    role: GROUP_ROLES.OWNER,
  });
  if (!ownerMembership) throw new ApiError(403, "Only owner can assign admins");

  // 2. Update Role
  const member = await GroupMembership.findOneAndUpdate(
    { group: groupId, user: memberId },
    { role: GROUP_ROLES.ADMIN },
    { new: true }
  );

  if (!member) throw new ApiError(404, "Member not found");

  return { role: GROUP_ROLES.ADMIN };
};

const revokeAdminService = async (groupId, memberId, ownerId) => {
  // 1. Verify Owner
  const ownerMembership = await GroupMembership.findOne({
    group: groupId,
    user: ownerId,
    role: GROUP_ROLES.OWNER,
  });
  if (!ownerMembership) throw new ApiError(403, "Only owner can revoke admins");

  // 2. Update Role
  const member = await GroupMembership.findOneAndUpdate(
    { group: groupId, user: memberId },
    { role: GROUP_ROLES.MEMBER },
    { new: true }
  );

  if (!member) throw new ApiError(404, "Member not found");

  return { role: GROUP_ROLES.MEMBER };
};

const getMyGroupsService = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  // Find groups where the user is a member (JOINED)
  const memberships = await GroupMembership.find({
    user: userId,
    status: GROUP_MEMBERSHIP_STATUS.JOINED,
  })
    .sort({ createdAt: -1 }) // Sort by joined date (descending)
    .select("group status role")
    .skip(skip)
    .limit(Number(limit))
    .populate({
      path: "group",
      select:
        "name slug description coverImage type privacy membersCount postsCount",
    });

  // Get total count for pagination
  const totalDocs = await GroupMembership.countDocuments({
    user: userId,
    status: GROUP_MEMBERSHIP_STATUS.JOINED,
  });

  const totalPages = Math.ceil(totalDocs / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Format the response
  const groups = memberships.map((membership) => {
    const group = membership.group;
    const status = membership.status;
    const role = membership.role;

    return {
      group: {
        _id: group._id,
        name: group.name,
        slug: group.slug,
        description: group.description,
        coverImage: group.coverImage,
        type: group.type,
        privacy: group.privacy,
        membersCount: group.membersCount,
        postsCount: group.postsCount,
      },
      meta: {
        status,
        isMember: status === GROUP_MEMBERSHIP_STATUS.JOINED,
        isAdmin: role === "ADMIN" || role === "OWNER",
      },
    };
  });

  return {
    groups,
    pagination: {
      totalDocs,
      limit: Number(limit),
      page: Number(page),
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  };
};

const getUniversityGroupsService = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const groupsData = await Group.find({
    type: GROUP_TYPES.OFFICIAL_INSTITUTION,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const groupIds = groupsData.map((g) => g._id);

  const memberships = await GroupMembership.find({
    user: userId,
    group: { $in: groupIds },
  }).lean();

  const groups = groupsData.map((group) => {
    const membership = memberships.find(
      (m) => m.group.toString() === group._id.toString()
    );
    const status = membership
      ? membership.status
      : GROUP_MEMBERSHIP_STATUS.NOT_JOINED;

    const isMember = status === GROUP_MEMBERSHIP_STATUS.JOINED;
    const isAdmin =
      membership?.role === "ADMIN" || membership?.role === "OWNER";

    return {
      group,
      meta: {
        status,
        isMember,
        isAdmin,
      },
    };
  });

  const totalDocs = await Group.countDocuments({
    type: GROUP_TYPES.OFFICIAL_INSTITUTION,
  });

  const totalPages = Math.ceil(totalDocs / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    groups,
    pagination: {
      totalDocs,
      limit: Number(limit),
      page: Number(page),
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  };
};

const getCareerGroupsService = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const groupsData = await Group.find({ type: GROUP_TYPES.JOBS_CAREERS })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const groupIds = groupsData.map((g) => g._id);

  const memberships = await GroupMembership.find({
    user: userId,
    group: { $in: groupIds },
  }).lean();

  const groups = groupsData.map((group) => {
    const membership = memberships.find(
      (m) => m.group.toString() === group._id.toString()
    );
    const status = membership
      ? membership.status
      : GROUP_MEMBERSHIP_STATUS.NOT_JOINED;

    const isMember = status === GROUP_MEMBERSHIP_STATUS.JOINED;
    const isAdmin =
      membership?.role === "ADMIN" || membership?.role === "OWNER";

    return {
      group,
      meta: {
        status,
        isMember,
        isAdmin,
      },
    };
  });

  const totalDocs = await Group.countDocuments({
    type: GROUP_TYPES.JOBS_CAREERS,
  });

  const totalPages = Math.ceil(totalDocs / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    groups,
    pagination: {
      totalDocs,
      limit: Number(limit),
      page: Number(page),
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  };
};

const getSuggestedGroupsService = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  // 1. Find all groups the user has ANY relationship with (Joined, Pending, Invited, etc.)
  const userMemberships = await GroupMembership.find({
    user: userId,
  }).select("group");

  const excludedGroupIds = userMemberships.map((m) => m.group);

  // 2. Query groups:
  //    - Exclude groups user is already related to
  //    - Exclude CLOSED groups
  const query = {
    _id: { $nin: excludedGroupIds },
    privacy: { $ne: GROUP_PRIVACY.CLOSED },
  };

  const groupsData = await Group.find(query)
    .sort({ membersCount: -1, createdAt: -1 }) // Sort by popularity then newness
    .skip(skip)
    .limit(Number(limit))
    .lean();

  // All returned groups are NOT_JOINED by definition
  const groups = groupsData.map((group) => ({
    group,
    meta: {
      status: GROUP_MEMBERSHIP_STATUS.NOT_JOINED,
      isMember: false,
      isAdmin: false,
    },
  }));

  const totalDocs = await Group.countDocuments(query);

  const totalPages = Math.ceil(totalDocs / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    groups,
    pagination: {
      totalDocs,
      limit: Number(limit),
      page: Number(page),
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  };
};

const getSentRequestsGroupsService = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const memberships = await GroupMembership.find({
    user: userId,
    status: GROUP_MEMBERSHIP_STATUS.PENDING,
  })
    .sort({ createdAt: -1 })
    .select("group")
    .skip(skip)
    .limit(Number(limit))
    .populate("group");

  const totalDocs = await GroupMembership.countDocuments({
    user: userId,
    status: GROUP_MEMBERSHIP_STATUS.PENDING,
  });

  const totalPages = Math.ceil(totalDocs / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const groups = memberships.map((m) => {
    const groupObj = m.group.toObject ? m.group.toObject() : m.group;
    return {
      group: groupObj,
      meta: {
        status: GROUP_MEMBERSHIP_STATUS.PENDING,
        isMember: false,
        isAdmin: false,
      },
    };
  });

  return {
    groups,
    pagination: {
      totalDocs,
      limit: Number(limit),
      page: Number(page),
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  };
};

const getInvitedGroupsService = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const memberships = await GroupMembership.find({
    user: userId,
    status: GROUP_MEMBERSHIP_STATUS.INVITED,
  })
    .sort({ createdAt: -1 })
    .select("group")
    .skip(skip)
    .limit(Number(limit))
    .populate("group");

  const totalDocs = await GroupMembership.countDocuments({
    user: userId,
    status: GROUP_MEMBERSHIP_STATUS.INVITED,
  });

  const totalPages = Math.ceil(totalDocs / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const groups = memberships.map((m) => {
    const groupObj = m.group.toObject ? m.group.toObject() : m.group;
    return {
      group: groupObj,
      meta: {
        status: GROUP_MEMBERSHIP_STATUS.INVITED,
        isMember: false,
        isAdmin: false,
      },
    };
  });

  return {
    groups,
    pagination: {
      totalDocs,
      limit: Number(limit),
      page: Number(page),
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  };
};

const getGroupDetailsService = async (slug, userId) => {
  const group = await Group.findOne({ slug }).lean();

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  // Get user's membership status
  const membership = await GroupMembership.findOne({
    group: group._id,
    user: userId,
  }).lean();

  const status = membership
    ? membership.status
    : GROUP_MEMBERSHIP_STATUS.NOT_JOINED;

  // Metadata
  const meta = {
    status,
    isMember: status === GROUP_MEMBERSHIP_STATUS.JOINED,
    isAdmin: membership?.role === "ADMIN" || membership?.role === "OWNER",
  };

  return { group, meta };
};

const getGroupMembersService = async (groupId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  // Verify group exists
  const group = await Group.findById(groupId);
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  // Fetch members
  const membersData = await GroupMembership.find({
    group: groupId,
    status: GROUP_MEMBERSHIP_STATUS.JOINED,
  })
    .populate("user", "name username avatar")
    .sort({ role: 1, createdAt: 1 }) // Owner -> Admin -> Member
    .skip(skip)
    .limit(Number(limit));

  const totalDocs = await GroupMembership.countDocuments({
    group: groupId,
    status: GROUP_MEMBERSHIP_STATUS.JOINED,
  });

  // Format response
  const members = membersData.map((m) => ({
    member: {
      _id: m._id,
      user: m.user,
      role: m.role,
      joinedAt: m.joinedAt || m.createdAt,
    },
    meta: {
      isFriend: false, // TODO: Implement friend check
      hasPendingRequest: false,
      isSentRequest: false,
    },
  }));

  const totalPages = Math.ceil(totalDocs / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    members,
    pagination: {
      totalDocs,
      limit: Number(limit),
      page: Number(page),
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  };
};

const getGroupFeedService = async (slug, userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  // 1. Find Group
  const group = await Group.findOne({ slug }).select("_id privacy settings");
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  // 2. Check Permission (If Private, must be member)
  if (group.privacy === GROUP_PRIVACY.PRIVATE) {
    const membership = await GroupMembership.findOne({
      group: group._id,
      user: userId,
      status: GROUP_MEMBERSHIP_STATUS.JOINED,
    });

    if (!membership) {
      throw new ApiError(403, "You must be a member to view posts");
    }
  }

  // 3. Query Posts
  const query = {
    postOnModel: POST_TARGET_MODELS.GROUP,
    postOnId: group._id,
    isDeleted: false,
    isArchived: false,
  };

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("author", "fullName avatar userName")
    .lean();

  // 4. Add Context (Like, Read, Mine)
  let viewedPostIds = new Set();
  let likedPostIds = new Set();
  const postIds = posts.map((p) => p._id);

  if (userId && posts.length > 0) {
    const viewedPosts = await ReadPost.find({
      user: userId,
      post: { $in: postIds },
    }).select("post");
    viewedPostIds = new Set(viewedPosts.map((vp) => vp.post.toString()));

    const likedPosts = await Reaction.find({
      user: userId,
      targetModel: REACTION_TARGET_MODELS.POST,
      targetId: { $in: postIds },
    }).select("targetId");
    likedPostIds = new Set(likedPosts.map((r) => r.targetId.toString()));
  }

  const postsWithContext = posts.map((post) => ({
    post,
    meta: {
      isLiked: likedPostIds.has(post._id.toString()),
      isSaved: false,
      isMine: post.author._id.toString() === userId.toString(),
      isRead: viewedPostIds.has(post._id.toString()),
    },
  }));

  const totalDocs = await Post.countDocuments(query);
  const totalPages = Math.ceil(totalDocs / limit);

  return {
    posts: postsWithContext,
    pagination: {
      totalDocs,
      limit: Number(limit),
      page: Number(page),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const createGroupPostService = async (slug, userId, postData) => {
  // 1. Find Group
  const group = await Group.findOne({ slug });
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  // 2. Check Membership
  const membership = await GroupMembership.findOne({
    group: group._id,
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
    throw new ApiError(403, "Posting is disabled for members");
  }

  // 4. Prepare Post Data
  const newPostData = {
    ...postData,
    postOnModel: POST_TARGET_MODELS.GROUP,
    postOnId: group._id,
  };

  // 5. Create Post using common service
  const formattedPost = await createPostService(newPostData, userId);

  // 6. Update Group Stats
  await Group.findByIdAndUpdate(group._id, { $inc: { postsCount: 1 } });

  return formattedPost;
};

export {
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
  getGroupFeedService,
  createGroupPostService,
};
