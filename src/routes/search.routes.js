import { Router } from "express";
import {
  globalSearch,
  searchUsers,
  searchPosts,
  searchGroups,
  searchInstitutions,
  searchDepartments,
  searchComments,
  getSearchSuggestions,
} from "../controllers/search.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { cacheMiddleware } from "../utils/cache.js";

const router = Router();

/**
 * ====================================
 * SEARCH ROUTES
 * ====================================
 *
 * All search endpoints require authentication to ensure proper
 * privacy controls and personalized results.
 */

// Global search endpoint - searches across all content types
router
  .route("/global")
  .get(verifyJWT, cacheMiddleware(3 * 60 * 1000), globalSearch);

// Category-specific search endpoints
router
  .route("/users")
  .get(verifyJWT, cacheMiddleware(5 * 60 * 1000), searchUsers);
router
  .route("/posts")
  .get(verifyJWT, cacheMiddleware(2 * 60 * 1000), searchPosts);
router
  .route("/groups")
  .get(verifyJWT, cacheMiddleware(10 * 60 * 1000), searchGroups);
router
  .route("/institutions")
  .get(verifyJWT, cacheMiddleware(15 * 60 * 1000), searchInstitutions);
router
  .route("/departments")
  .get(verifyJWT, cacheMiddleware(15 * 60 * 1000), searchDepartments);
router
  .route("/comments")
  .get(verifyJWT, cacheMiddleware(1 * 60 * 1000), searchComments);

// Search suggestions for auto-complete (shorter cache time)
router
  .route("/suggestions")
  .get(verifyJWT, cacheMiddleware(30 * 1000), getSearchSuggestions);

export default router;
