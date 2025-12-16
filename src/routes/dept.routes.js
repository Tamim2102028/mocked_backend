import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getDeptFeed,
  createDeptPost,
  getDeptDetails,
  getTeachers,
} from "../controllers/dept.controllers.js";

const router = Router();
router.use(verifyJWT);

router.get("/:deptId", getDeptDetails);
router.get("/:deptId/feed", getDeptFeed);
router.get("/:deptId/teachers", getTeachers);
router.post("/:deptId/post", createDeptPost);

export default router;
