import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFile } from "../utils/fileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import {
  USER_TYPES,
  PROFILE_RELATION_STATUS,
  POST_TARGET_MODELS,
  POST_VISIBILITY,
  FRIENDSHIP_STATUS,
  FOLLOW_TARGET_MODELS,
} from "../constants/index.js";
import { findInstitutionByEmailDomain } from "../services/academic.service.js";
import { Post } from "../models/post.model.js";
import { Friendship } from "../models/friendship.model.js";
import { Follow } from "../models/follow.model.js";

// --- Utility: Token Generator ---
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("JWT Generation Error:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

// ==========================================
// 🚀 1. REGISTER USER (AUTO-INSTITUTION LINKING LOGIC ADDED)
// ==========================================
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, userName, userType } = req.body;

  const existedUser = await User.findOne({ $or: [{ email }, { userName }] });
  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  if ([USER_TYPES.ADMIN, USER_TYPES.OWNER].includes(userType)) {
    throw new ApiError(403, "Restricted user type.");
  }

  // ✅ CORE LOGIC UPDATE STARTS HERE
  // 3. Check for institution using email domain
  const institution = await findInstitutionByEmailDomain(email);

  // 4. File Upload Logic (remains same)
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  let avatar, coverImage;
  if (avatarLocalPath) {
    avatar = await uploadFile(avatarLocalPath);
    if (!avatar) throw new ApiError(500, "Failed to upload avatar");
  }
  if (coverImageLocalPath) {
    coverImage = await uploadFile(coverImageLocalPath);
    if (!coverImage) throw new ApiError(500, "Failed to upload cover image");
  }

  // 5. Create User Payload with conditional institution linking
  const userPayload = {
    fullName,
    email,
    password,
    userName,
    userType,
    // Default values
    isStudentEmail: false,
  };

  if (avatar?.url) userPayload.avatar = avatar.url;
  if (coverImage?.url) userPayload.coverImage = coverImage.url;

  // If an institution was found, link it to the user
  if (institution) {
    userPayload.isStudentEmail = true;
    userPayload.institution = institution._id; // The magic link!
    userPayload.institutionType = institution.type; // Bonus: also set the type
  }
  // ✅ CORE LOGIC UPDATE ENDS HERE

  const user = await User.create(userPayload);
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Token generation and response (remains same)
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: createdUser, accessToken, refreshToken },
        "User registered Successfully"
      )
    );
});

// ==========================================
// 🚀 2. LOGIN USER
// ==========================================
const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body; // ⚠️ UPDATED from nickName

  if (!email && !userName) {
    // ⚠️ UPDATED
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }], // ⚠️ UPDATED
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged In Successfully"
      )
    );
});

// ==========================================
// 🚀 3. LOGOUT USER
// ==========================================
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// ==========================================
// 🚀 4. REFRESH TOKEN
// ==========================================
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user || incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
    } = // Renamed to avoid confusion
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// ==========================================
// 🚀 5. CHANGE PASSWORD (পূর্বের সরল লজিকে ফিরিয়ে আনা হলো)
// ==========================================
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // ১. ডাটাবেস থেকে ইউজারকে খুঁজে বের করা
  const user = await User.findById(req.user._id);

  // ২. পুরনো পাসওয়ার্ড সঠিক কিনা তা যাচাই করা
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  // ৩. নতুন পাসওয়ার্ড সেট করা
  user.password = newPassword;

  // ৪. পুরনো টোকেন বাতিল করার জন্য passwordChangedAt সময় সেট করা (নিরাপত্তার জন্য এটি থাকবে)
  user.passwordChangedAt = Date.now();

  // ৫. ইউজারের ডকুমেন্ট সেভ করা
  await user.save({ validateBeforeSave: false });

  // ৬. একটি সাধারণ সফল বার্তা পাঠানো। কোনো নতুন টোকেন ইস্যু করা হবে না।
  // ইউজারকে নতুন পাসওয়ার্ড দিয়ে আবার লগইন করতে হবে।
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully."));
});

// ==========================================
// 🚀 6. GET CURRENT USER (Me)
// ==========================================
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

// ==========================================
// 🚀 7. UPDATE ACADEMIC PROFILE (ONBOARDING)
// ==========================================
const updateAcademicProfile = asyncHandler(async (req, res) => {
  const {
    institution,
    department,
    session,
    section,
    studentId, // Student
    teacherId,
    rank,
    officeHours, // Teacher
  } = req.body;

  if (!institution || !department) {
    throw new ApiError(400, "Institution and Department are required");
  }

  let academicInfoPayload = { department };
  const currentUserType = req.user.userType;

  if (currentUserType === USER_TYPES.STUDENT) {
    if (!session) throw new ApiError(400, "Session is required for Students");
    academicInfoPayload.session = session;
    academicInfoPayload.section = section;
    academicInfoPayload.studentId = studentId;
  } else if (currentUserType === USER_TYPES.TEACHER) {
    academicInfoPayload.teacherId = teacherId;
    academicInfoPayload.rank = rank;
    academicInfoPayload.officeHours = officeHours;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { institution, academicInfo: academicInfoPayload } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Academic profile updated"));
});

// ==========================================
// 🚀 8. UPDATE AVATAR
// ==========================================
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadFile(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(500, "Error uploading avatar");
  }

  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, { url: avatar.url }, "Avatar updated successfully")
    );
});

// ==========================================
// 🚀 9. UPDATE CoverImage
// ==========================================
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  const coverImage = await uploadFile(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(500, "Error uploading cover image");
  }

  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { url: coverImage.url },
        "Cover image updated successfully"
      )
    );
});

// ==========================================
// 🚀 10. UPDATE GENERAL ACCOUNT DETAILS
// ==========================================
const updateAccountDetails = asyncHandler(async (req, res) => {
  // ✅ NEW: Prevent username change
  // ফাংশনের শুরুতেই আমরা চেক করছি ইউজার `userName` পাঠিয়েছে কিনা।
  // যদি পাঠিয়ে থাকে, তাহলে আমরা একটি এরর দিয়ে দেব।
  if (req.body.userName) {
    throw new ApiError(400, "Username cannot be changed.");
  }

  const { phoneNumber } = req.body;

  // 1. Check if at least one field is present
  if (Object.keys(req.body).length === 0) {
    throw new ApiError(400, "At least one field is required to update");
  }

  // 2. Uniqueness Check for other fields (like phone number)
  if (phoneNumber) {
    const existingPhoneUser = await User.findOne({ phoneNumber });
    if (
      existingPhoneUser &&
      existingPhoneUser._id.toString() !== req.user._id.toString()
    ) {
      throw new ApiError(409, "Phone number already used by another account");
    }
  }

  // 3. Update User
  // যেহেতু আমরা আগেই userName চেক করে নিয়েছি, তাই এখন req.body ব্যবহার করা নিরাপদ।
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: req.body },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// ==========================================
// 🚀 11. GET USER PROFILE HEADER (By Username)
// ==========================================
const getUserProfileHeader = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  // 1. Find User by Username (Real DB)
  const user = await User.findOne({ userName: username })
    .select("-password -refreshToken")
    .populate("institution", "name logo")
    .populate("academicInfo.department", "name code");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 2. Determine Friendship Status
  const isSelf = req.user?._id.toString() === user._id.toString();
  let relationStatus = PROFILE_RELATION_STATUS.NOT_FRIENDS;
  let isFollowing = false;
  let isBlockedByMe = false;
  let isBlockedByTarget = false;

  if (isSelf) {
    relationStatus = PROFILE_RELATION_STATUS.SELF;
  } else {
    // Friendship Status
    const friendship = await Friendship.findOne({
      $or: [
        { requester: req.user._id, recipient: user._id },
        { requester: user._id, recipient: req.user._id },
      ],
    });

    if (friendship) {
      if (friendship.status === FRIENDSHIP_STATUS.ACCEPTED) {
        relationStatus = PROFILE_RELATION_STATUS.FRIEND;
      } else if (friendship.status === FRIENDSHIP_STATUS.BLOCKED) {
        relationStatus = PROFILE_RELATION_STATUS.BLOCKED;
        if (friendship.requester.toString() === req.user._id.toString()) {
          isBlockedByMe = true;
        } else {
          isBlockedByTarget = true;
        }
      } else if (friendship.status === FRIENDSHIP_STATUS.PENDING) {
        if (friendship.requester.toString() === req.user._id.toString()) {
          relationStatus = PROFILE_RELATION_STATUS.REQUEST_SENT;
        } else {
          relationStatus = PROFILE_RELATION_STATUS.REQUEST_RECEIVED;
        }
      }
    }

    // Follow Status
    const follow = await Follow.findOne({
      follower: req.user._id,
      following: user._id,
      followingModel: FOLLOW_TARGET_MODELS.USER,
    });
    if (follow) isFollowing = true;
  }

  // 3. Calculate Posts Count (Dynamic)
  let visibilityQuery = {
    postOnId: user._id,
    postOnModel: POST_TARGET_MODELS.USER,
    isDeleted: false,
    isArchived: false,
  };

  let postsCount = 0;

  if (isSelf) {
    // Own Profile: See everything
    postsCount = await Post.countDocuments(visibilityQuery);
  } else if (!isBlockedByMe && !isBlockedByTarget) {
    // Visitor: Check Relationship (Only if NOT blocked)
    const isFriend = relationStatus === PROFILE_RELATION_STATUS.FRIEND;
    if (isFriend) {
      visibilityQuery.visibility = {
        $in: [POST_VISIBILITY.PUBLIC, POST_VISIBILITY.CONNECTIONS],
      };
    } else {
      visibilityQuery.visibility = POST_VISIBILITY.PUBLIC;
    }
    postsCount = await Post.countDocuments(visibilityQuery);
  } else {
    // Blocked: postsCount remains 0
  }

  // Recalculate counts to ensure accuracy (Temporary Fix for Dev)
  const realFollowersCount = await Follow.countDocuments({
    following: user._id,
    followingModel: FOLLOW_TARGET_MODELS.USER,
  });
  const realFollowingCount = await Follow.countDocuments({
    follower: user._id,
  });
  const realConnectionsCount = await Friendship.countDocuments({
    $or: [{ requester: user._id }, { recipient: user._id }],
    status: FRIENDSHIP_STATUS.ACCEPTED,
  });

  const userProfileHeader = {
    ...user.toObject(),
    profile_relation_status: relationStatus,
    isFollowing,
    isBlockedByMe,
    isBlockedByTarget,
    // Stats
    stats: {
      postsCount: postsCount,
      friendsCount: realConnectionsCount,
      followersCount: realFollowersCount,
      followingCount: realFollowingCount,
      publicFilesCount: 7, // TODO: Implement Files
    },
    isOwnProfile: isSelf,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userProfileHeader,
        "User profile fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAcademicProfile,
  updateUserAvatar,
  updateUserCoverImage,
  updateAccountDetails,
  getUserProfileHeader,
};
