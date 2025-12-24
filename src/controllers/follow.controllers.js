import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Follow } from "../models/follow.model.js";
import { User } from "../models/user.model.js";
import { Institution } from "../models/institution.model.js";
import { Department } from "../models/department.model.js";
import { FOLLOW_TARGET_MODELS } from "../constants/index.js";

// ==============================================================================
// 1. GENERALIZED FOLLOW (User, Page, Institution, Department)
// ==============================================================================
const toggleFollow = asyncHandler(async (req, res) => {
  const { targetId } = req.params;
  const { targetModel = FOLLOW_TARGET_MODELS.USER } = req.body; // Default to User
  const currentUserId = req.user._id;

  // 1. Validate Target Model
  if (!Object.values(FOLLOW_TARGET_MODELS).includes(targetModel)) {
    throw new ApiError(400, "Invalid target model");
  }

  // 2. Prevent Self-Follow (Only for User)
  if (
    targetModel === FOLLOW_TARGET_MODELS.USER &&
    targetId === currentUserId.toString()
  ) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  // 3. Check if Target Exists
  let targetExists = null;

  switch (targetModel) {
    case FOLLOW_TARGET_MODELS.USER:
      targetExists = await User.findById(targetId);
      break;
    case FOLLOW_TARGET_MODELS.INSTITUTION:
      targetExists = await Institution.findById(targetId);
      break;
    case FOLLOW_TARGET_MODELS.DEPARTMENT:
      targetExists = await Department.findById(targetId);
      break;
    // TODO: Add Page model check when ready
    case FOLLOW_TARGET_MODELS.PAGE:
      // targetExists = await Page.findById(targetId);
      break;
    default:
      throw new ApiError(400, "Invalid model type");
  }

  if (!targetExists) {
    throw new ApiError(404, `${targetModel} not found`);
  }

  // 4. Check Existing Follow
  const existingFollow = await Follow.findOne({
    follower: currentUserId,
    following: targetId,
    followingModel: targetModel,
  });

  // 5. Toggle Logic (Follow/Unfollow)
  if (existingFollow) {
    // UNFOLLOW
    await Follow.findByIdAndDelete(existingFollow._id);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isFollowing: false },
          `Unfollowed ${targetModel} successfully`
        )
      );
  } else {
    // FOLLOW
    await Follow.create({
      follower: currentUserId,
      following: targetId,
      followingModel: targetModel,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isFollowing: true },
          `Followed ${targetModel} successfully`
        )
      );
  }
});

export { toggleFollow };
