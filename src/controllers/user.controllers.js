import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  registerUserService,
  loginUserService,
  logoutUserService,
  refreshAccessTokenService,
  changePasswordService,
  updateAcademicProfileService,
  updateUserAvatarService,
  updateUserCoverImageService,
  updateAccountDetailsService,
  getUserProfileHeaderService,
  getUserDetailsService,
} from "../services/user.service.js";

// ==========================================
// 🚀 1. REGISTER USER
// ==========================================
const registerUser = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await registerUserService(
    req.body,
    req.files
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
        {
          user,
        },
        "User registered Successfully"
      )
    );
});

// ==========================================
// 🚀 2. LOGIN USER
// ==========================================
const loginUser = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await loginUserService(req.body);

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
        {
          user,
        },
        "User logged In Successfully"
      )
    );
});

// ==========================================
// 🚀 3. LOGOUT USER
// ==========================================
const logoutUser = asyncHandler(async (req, res) => {
  await logoutUserService(req.user._id);

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

  const { accessToken, refreshToken } = await refreshAccessTokenService(incomingRefreshToken);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {}, "Access token refreshed"));
});

// ==========================================
// 🚀 5. CHANGE PASSWORD
// ==========================================
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  await changePasswordService(req.user._id, oldPassword, newPassword);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully."));
});

// ==========================================
// 🚀 6. GET CURRENT USER (Me)
// ==========================================
const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: req.user,
      },
      "User fetched successfully"
    )
  );
});

// ==========================================
// 🚀 7. UPDATE ACADEMIC PROFILE (ONBOARDING)
// ==========================================
const updateAcademicProfile = asyncHandler(async (req, res) => {
  const { user } = await updateAcademicProfileService(
    req.user._id,
    req.user.userType,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
      },
      "Academic profile updated successfully"
    )
  );
});

// ==========================================
// 🚀 8. UPDATE AVATAR
// ==========================================
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  const { avatarUrl } = await updateUserAvatarService(
    req.user._id,
    avatarLocalPath
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { avatarUrl }, "Avatar updated successfully"));
});

// ==========================================
// 🚀 9. UPDATE CoverImage
// ==========================================
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  const { coverImageUrl } = await updateUserCoverImageService(
    req.user._id,
    coverImageLocalPath
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { coverImageUrl },
        "Cover image updated successfully"
      )
    );
});

// ==========================================
// 🚀 10. UPDATE GENERAL ACCOUNT DETAILS
// ==========================================
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { user } = await updateAccountDetailsService(req.user._id, req.body);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
      },
      "Account details updated successfully"
    )
  );
});

// ==========================================
// 🚀 11. GET USER PROFILE HEADER (By Username)
// ==========================================
const getUserProfileHeader = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { user, meta } = await getUserProfileHeaderService(
    username,
    req.user?._id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        meta,
      },
      "User profile fetched successfully"
    )
  );
});

// ==========================================
// 🚀 12. GET USER DETAILS (Lightweight - No Relations/Stats)
// ==========================================
const getUserDetails = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { user } = await getUserDetailsService(username);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
      },
      "User details fetched successfully"
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
  getUserDetails,
};
