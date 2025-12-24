import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getFriendsList,
  getReceivedRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectReceivedRequest,
  cancelSentRequest,
  unfriendUser,
} from "../controllers/friendship.controllers.js";

const router = Router();
router.use(verifyJWT);

// ==================================================
// 🤝 GET Routes (for displaying lists)
// ==================================================

// Get my accepted friends list
router.get("/list", getFriendsList);

// Get requests I have received from others
router.get("/requests/received", getReceivedRequests);

// TODO: Add a route for sent requests if needed:
// router.get("/requests/sent", getSentRequests);

// ==================================================
// ⚙️ ACTION Routes (Specific & Secure)
// ==================================================

// Send a friend request to a user
router.post("/request/send/:userId", sendFriendRequest);

// Accept a request that I received (from userId)
router.patch("/request/accept/:userId", acceptFriendRequest);

// Reject a request that I received (from userId)
router.delete("/request/reject/:userId", rejectReceivedRequest);

// Cancel a request that I sent (to userId)
router.delete("/request/cancel/:userId", cancelSentRequest);

// Unfriend a user I am connected with (userId)
router.delete("/unfriend/:userId", unfriendUser);

export default router;
