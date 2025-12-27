import { Group } from "../models/group.model.js";
import { GroupMembership } from "../models/groupMembership.model.js";
import {
  GROUP_TYPES,
  GROUP_ROLES,
  GROUP_MEMBERSHIP_STATUS,
  GROUP_PRIVACY,
} from "../constants/index.js";
import { ApiError } from "../utils/ApiError.js";

const createGroupService = async ({
  name,
  description,
  type,
  privacy,
  settings,
  avatar,
  coverImage,
  creatorId,
}) => {
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
    settings: settings || {},
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
  });

  return group;
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

  return { groupId, status: "LEFT" };
};

export { createGroupService, leaveGroupService };
