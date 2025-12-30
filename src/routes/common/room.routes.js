import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import {
  getRoomFeed,
  createRoomPost,
  getMyRooms,
  createRoom,
  getRoomDetails,
} from "../../controllers/room.controllers.js";

const router = Router();
router.use(verifyJWT);

// Global Room Routes
router.post("/", createRoom);
router.get("/my", getMyRooms);

// Specific Room Routes
router.get("/:roomId", getRoomDetails);
router.get("/:roomId/feed", getRoomFeed);
router.post("/:roomId/post", createRoomPost);

export default router;
