import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import SearchService from "../services/search.service.js";
import { validatePaginationParams } from "../utils/pagination.js";

/**
 * ====================================
 * SEARCH CONTROLLERS
 * ====================================
 *
 * Handles all search-related HTTP requests with proper validation
 * and error handling.
 */

/**
 * Global search across all content types
 * GET /api/v1/search/global?q={query}&type={type}&page={page}&limit={limit}
 */
const globalSearch = asyncHandler(async (req, res) => {
  const {
    q: query,
    type = "all",
    page = 1,
    limit = 20,
    sortBy = "relevance",
  } = req.query;
  const currentUserId = req.user._id;

  // Input validation
  if (!query || query.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters long");
  }

  const validTypes = [
    "all",
    "users",
    "posts",
    "groups",
    "institutions",
    "departments",
    "comments",
  ];
  if (!validTypes.includes(type)) {
    throw new ApiError(
      400,
      `Invalid search type. Must be one of: ${validTypes.join(", ")}`
    );
  }

  // Enhanced pagination validation
  const { page: pageNum, limit: limitNum } = validatePaginationParams(
    page,
    limit,
    50
  );

  try {
    const startTime = Date.now();

    const searchResults = await SearchService.performGlobalSearch(
      query,
      { type, currentUserId, sortBy },
      { page: pageNum, limit: limitNum }
    );

    const searchTime = Date.now() - startTime;
    searchResults.searchTime = searchTime;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          searchResults,
          `Search completed in ${searchTime}ms`
        )
      );
  } catch (error) {
    throw new ApiError(500, `Search failed: ${error.message}`);
  }
});

/**
 * Search users specifically
 * GET /api/v1/search/users?q={query}&page={page}&limit={limit}
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { q: query, page = 1, limit = 20 } = req.query;
  const currentUserId = req.user._id;

  if (!query || query.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters long");
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
    throw new ApiError(400, "Invalid pagination parameters");
  }

  try {
    const startTime = Date.now();

    const result = await SearchService.searchUsersByQuery(
      query,
      currentUserId,
      { page: pageNum, limit: limitNum }
    );

    const searchTime = Date.now() - startTime;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...result,
          searchTime,
          query: query.trim(),
        },
        `Found ${result.users.length} users`
      )
    );
  } catch (error) {
    throw new ApiError(500, `User search failed: ${error.message}`);
  }
});

/**
 * Search posts specifically
 * GET /api/v1/search/posts?q={query}&page={page}&limit={limit}
 */
const searchPosts = asyncHandler(async (req, res) => {
  const { q: query, page = 1, limit = 15 } = req.query;
  const currentUserId = req.user._id;

  if (!query || query.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters long");
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
    throw new ApiError(400, "Invalid pagination parameters");
  }

  try {
    const startTime = Date.now();

    const result = await SearchService.searchPostsByQuery(
      query,
      currentUserId,
      { page: pageNum, limit: limitNum }
    );

    const searchTime = Date.now() - startTime;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...result,
          searchTime,
          query: query.trim(),
        },
        `Found ${result.posts.length} posts`
      )
    );
  } catch (error) {
    throw new ApiError(500, `Post search failed: ${error.message}`);
  }
});

/**
 * Search groups specifically
 * GET /api/v1/search/groups?q={query}&page={page}&limit={limit}
 */
const searchGroups = asyncHandler(async (req, res) => {
  const { q: query, page = 1, limit = 20 } = req.query;
  const currentUserId = req.user._id;

  if (!query || query.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters long");
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
    throw new ApiError(400, "Invalid pagination parameters");
  }

  try {
    const startTime = Date.now();

    const result = await SearchService.searchGroupsByQuery(
      query,
      currentUserId,
      { page: pageNum, limit: limitNum }
    );

    const searchTime = Date.now() - startTime;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...result,
          searchTime,
          query: query.trim(),
        },
        `Found ${result.groups.length} groups`
      )
    );
  } catch (error) {
    throw new ApiError(500, `Group search failed: ${error.message}`);
  }
});

/**
 * Search institutions specifically
 * GET /api/v1/search/institutions?q={query}&page={page}&limit={limit}
 */
const searchInstitutions = asyncHandler(async (req, res) => {
  const { q: query, page = 1, limit = 15 } = req.query;

  if (!query || query.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters long");
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
    throw new ApiError(400, "Invalid pagination parameters");
  }

  try {
    const startTime = Date.now();

    const result = await SearchService.searchInstitutionsByQuery(query, {
      page: pageNum,
      limit: limitNum,
    });

    const searchTime = Date.now() - startTime;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...result,
          searchTime,
          query: query.trim(),
        },
        `Found ${result.institutions.length} institutions`
      )
    );
  } catch (error) {
    throw new ApiError(500, `Institution search failed: ${error.message}`);
  }
});

/**
 * Search departments specifically
 * GET /api/v1/search/departments?q={query}&page={page}&limit={limit}
 */
const searchDepartments = asyncHandler(async (req, res) => {
  const { q: query, page = 1, limit = 20 } = req.query;

  if (!query || query.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters long");
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
    throw new ApiError(400, "Invalid pagination parameters");
  }

  try {
    const startTime = Date.now();

    const result = await SearchService.searchDepartmentsByQuery(query, {
      page: pageNum,
      limit: limitNum,
    });

    const searchTime = Date.now() - startTime;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...result,
          searchTime,
          query: query.trim(),
        },
        `Found ${result.departments.length} departments`
      )
    );
  } catch (error) {
    throw new ApiError(500, `Department search failed: ${error.message}`);
  }
});

/**
 * Search comments specifically
 * GET /api/v1/search/comments?q={query}&page={page}&limit={limit}
 */
const searchComments = asyncHandler(async (req, res) => {
  const { q: query, page = 1, limit = 10 } = req.query;
  const currentUserId = req.user._id;

  if (!query || query.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters long");
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
    throw new ApiError(400, "Invalid pagination parameters");
  }

  try {
    const startTime = Date.now();

    const result = await SearchService.searchCommentsByQuery(
      query,
      currentUserId,
      { page: pageNum, limit: limitNum }
    );

    const searchTime = Date.now() - startTime;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...result,
          searchTime,
          query: query.trim(),
        },
        `Found ${result.comments.length} comments`
      )
    );
  } catch (error) {
    throw new ApiError(500, `Comment search failed: ${error.message}`);
  }
});

/**
 * Get search suggestions for auto-complete
 * GET /api/v1/search/suggestions?q={query}
 */
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q: query } = req.query;
  const currentUserId = req.user._id;

  if (!query || query.trim().length < 1) {
    return res.status(200).json(new ApiResponse(200, [], "No query provided"));
  }

  try {
    const suggestions = await SearchService.generateSearchSuggestions(
      query.trim(),
      currentUserId
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          suggestions,
          `Generated ${suggestions.length} suggestions`
        )
      );
  } catch (error) {
    throw new ApiError(500, `Suggestions failed: ${error.message}`);
  }
});

export {
  globalSearch,
  searchUsers,
  searchPosts,
  searchGroups,
  searchInstitutions,
  searchDepartments,
  searchComments,
  getSearchSuggestions,
};
