import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { Group } from "../models/group.model.js";
import { Institution } from "../models/institution.model.js";
import { Department } from "../models/department.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import {
  POST_VISIBILITY,
  GROUP_PRIVACY,
  ACCOUNT_STATUS,
  GROUP_MEMBERSHIP_STATUS,
} from "../constants/index.js";
import { GroupMembership } from "../models/groupMembership.model.js";
import {
  validatePaginationParams,
  createPaginationMeta,
  withPerformanceMonitoring,
  aggregateSearchResults,
  trackSearchAnalytics,
} from "../utils/pagination.js";

/**
 * ====================================
 * SEARCH SERVICE
 * ====================================
 *
 * Handles all search-related business logic with optimized queries
 * and proper privacy controls.
 */

class SearchService {
  /**
   * Perform global search across all content types
   */
  static async performGlobalSearch(query, filters = {}, pagination = {}) {
    const { type = "all", sortBy = "relevance" } = filters;
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    if (!query || query.trim().length < 2) {
      throw new ApiError(
        400,
        "Search query must be at least 2 characters long"
      );
    }

    const searchQuery = query.trim();
    const results = {};
    const counts = {};
    const startTime = Date.now();

    try {
      // Parallel search across all categories for better performance
      const searchPromises = [];

      if (type === "all" || type === "users") {
        searchPromises.push(
          this.searchUsersByQuery(searchQuery, filters.currentUserId, {
            page,
            limit: Math.min(limit, 20),
          }).then((data) => {
            results.users = data.users;
            counts.users = data.totalCount;
          })
        );
      }

      if (type === "all" || type === "posts") {
        searchPromises.push(
          this.searchPostsByQuery(searchQuery, filters.currentUserId, {
            page,
            limit: Math.min(limit, 15),
          }).then((data) => {
            results.posts = data.posts;
            counts.posts = data.totalCount;
          })
        );
      }

      if (type === "all" || type === "groups") {
        searchPromises.push(
          this.searchGroupsByQuery(searchQuery, filters.currentUserId, {
            page,
            limit: Math.min(limit, 20),
          }).then((data) => {
            results.groups = data.groups;
            counts.groups = data.totalCount;
          })
        );
      }

      if (type === "all" || type === "institutions") {
        searchPromises.push(
          this.searchInstitutionsByQuery(searchQuery, {
            page,
            limit: Math.min(limit, 15),
          }).then((data) => {
            results.institutions = data.institutions;
            counts.institutions = data.totalCount;
          })
        );
      }

      if (type === "all" || type === "departments") {
        searchPromises.push(
          this.searchDepartmentsByQuery(searchQuery, {
            page,
            limit: Math.min(limit, 20),
          }).then((data) => {
            results.departments = data.departments;
            counts.departments = data.totalCount;
          })
        );
      }

      if (type === "all" || type === "comments") {
        searchPromises.push(
          this.searchCommentsByQuery(searchQuery, filters.currentUserId, {
            page,
            limit: Math.min(limit, 10),
          }).then((data) => {
            results.comments = data.comments;
            counts.comments = data.totalCount;
          })
        );
      }

      await Promise.all(searchPromises);

      // Calculate total count
      counts.total = Object.values(counts).reduce(
        (sum, count) => sum + count,
        0
      );

      const searchTime = Date.now() - startTime;

      // Format results with nested pagination
      const formattedResults = {};

      Object.keys(results).forEach((category) => {
        if (results[category]) {
          const categoryLimit =
            category === "posts"
              ? 15
              : category === "institutions"
                ? 15
                : category === "comments"
                  ? 10
                  : 20;
          const categoryCount = counts[category];

          formattedResults[category] = {
            data: results[category],
            pagination: {
              totalDocs: categoryCount,
              limit: categoryLimit,
              page: page,
              totalPages: Math.ceil(categoryCount / categoryLimit),
              hasNextPage: page < Math.ceil(categoryCount / categoryLimit),
              hasPrevPage: page > 1,
            },
          };
        }
      });

      return {
        results: formattedResults,
        pagination: {
          totalDocs: counts.total,
          limit: limit,
          page: page,
          totalPages: Math.ceil(counts.total / limit),
          hasNextPage: page < Math.ceil(counts.total / limit),
          hasPrevPage: page > 1,
        },
        meta: {
          query: searchQuery,
          searchTime,
        },
      };
    } catch (error) {
      throw new ApiError(500, `Search failed: ${error.message}`);
    }
  }

  /**
   * Search users by query with privacy controls
   */
  static async searchUsersByQuery(query, currentUserId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const startTime = Date.now();

    try {
      // Build search pipeline
      const pipeline = [
        // Text search stage
        {
          $match: {
            $and: [
              { $text: { $search: query } },
              { accountStatus: ACCOUNT_STATUS.ACTIVE },
              { _id: { $ne: currentUserId } }, // Exclude current user
            ],
          },
        },
        // Add relevance score
        {
          $addFields: {
            score: { $meta: "textScore" },
          },
        },
        // Sort by relevance
        {
          $sort: { score: { $meta: "textScore" } },
        },
        // Lookup institution info
        {
          $lookup: {
            from: "institutions",
            localField: "institution",
            foreignField: "_id",
            as: "institutionInfo",
          },
        },
        // Project required fields
        {
          $project: {
            fullName: 1,
            userName: 1,
            avatar: 1,
            userType: 1,
            bio: 1,
            connectionsCount: 1,
            followersCount: 1,
            score: 1,
            institution: {
              $arrayElemAt: ["$institutionInfo.name", 0],
            },
            "academicInfo.department": 1,
          },
        },
        // Pagination
        { $skip: skip },
        { $limit: limit },
      ];

      const users = await User.aggregate(pipeline);

      // Get total count for pagination
      const countPipeline = [
        {
          $match: {
            $and: [
              { $text: { $search: query } },
              { accountStatus: ACCOUNT_STATUS.ACTIVE },
              { _id: { $ne: currentUserId } },
            ],
          },
        },
        { $count: "total" },
      ];

      const countResult = await User.aggregate(countPipeline);
      const totalCount = countResult[0]?.total || 0;
      const searchTime = Date.now() - startTime;

      return {
        users,
        pagination: {
          totalDocs: totalCount,
          limit: limit,
          page: page,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
        meta: {
          query: query.trim(),
          searchTime,
        },
      };
    } catch (error) {
      throw new ApiError(500, `User search failed: ${error.message}`);
    }
  }

  /**
   * Search posts with privacy and visibility controls
   */
  static async searchPostsByQuery(query, currentUserId, pagination = {}) {
    const { page = 1, limit = 15 } = pagination;
    const skip = (page - 1) * limit;

    try {
      // Build privacy-aware search pipeline
      const pipeline = [
        // Text search with privacy filters
        {
          $match: {
            $and: [
              { $text: { $search: query } },
              { isDeleted: false },
              {
                $or: [
                  { visibility: POST_VISIBILITY.PUBLIC },
                  {
                    $and: [
                      { visibility: POST_VISIBILITY.CONNECTIONS },
                      // TODO: Add friend/connection check here
                    ],
                  },
                  { author: currentUserId }, // User's own posts
                ],
              },
            ],
          },
        },
        // Add relevance score
        {
          $addFields: {
            score: { $meta: "textScore" },
          },
        },
        // Sort by relevance and recency
        {
          $sort: {
            score: { $meta: "textScore" },
            createdAt: -1,
          },
        },
        // Lookup author info
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorInfo",
          },
        },
        // Project required fields
        {
          $project: {
            content: 1,
            type: 1,
            attachments: 1,
            tags: 1,
            likesCount: 1,
            commentsCount: 1,
            createdAt: 1,
            score: 1,
            author: {
              $arrayElemAt: [
                {
                  $map: {
                    input: "$authorInfo",
                    as: "author",
                    in: {
                      _id: "$$author._id",
                      fullName: "$$author.fullName",
                      userName: "$$author.userName",
                      avatar: "$$author.avatar",
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        // Pagination
        { $skip: skip },
        { $limit: limit },
      ];

      const posts = await Post.aggregate(pipeline);

      // Get total count
      const countPipeline = [
        {
          $match: {
            $and: [
              { $text: { $search: query } },
              { isDeleted: false },
              {
                $or: [
                  { visibility: POST_VISIBILITY.PUBLIC },
                  { author: currentUserId },
                ],
              },
            ],
          },
        },
        { $count: "total" },
      ];

      const countResult = await Post.aggregate(countPipeline);
      const totalCount = countResult[0]?.total || 0;

      return {
        posts,
        totalCount,
        hasMore: skip + posts.length < totalCount,
      };
    } catch (error) {
      throw new ApiError(500, `Post search failed: ${error.message}`);
    }
  }

  /**
   * Search groups with membership and privacy controls
   */
  static async searchGroupsByQuery(query, currentUserId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    try {
      const pipeline = [
        // Text search with privacy filters
        {
          $match: {
            $and: [
              { $text: { $search: query } },
              { isDeleted: false },
              {
                $or: [
                  { privacy: GROUP_PRIVACY.PUBLIC },
                  // TODO: Add membership check for private groups
                ],
              },
            ],
          },
        },
        // Add relevance score
        {
          $addFields: {
            score: { $meta: "textScore" },
          },
        },
        // Sort by relevance and member count
        {
          $sort: {
            score: { $meta: "textScore" },
            membersCount: -1,
          },
        },
        // Lookup institution info
        {
          $lookup: {
            from: "institutions",
            localField: "institution",
            foreignField: "_id",
            as: "institutionInfo",
          },
        },
        // Project required fields
        {
          $project: {
            name: 1,
            description: 1,
            avatar: 1,
            type: 1,
            privacy: 1,
            membersCount: 1,
            postsCount: 1,
            score: 1,
            institution: {
              $arrayElemAt: ["$institutionInfo.name", 0],
            },
          },
        },
        // Pagination
        { $skip: skip },
        { $limit: limit },
      ];

      const groups = await Group.aggregate(pipeline);

      // Get total count
      const countPipeline = [
        {
          $match: {
            $and: [
              { $text: { $search: query } },
              { isDeleted: false },
              { privacy: GROUP_PRIVACY.PUBLIC },
            ],
          },
        },
        { $count: "total" },
      ];

      const countResult = await Group.aggregate(countPipeline);
      const totalCount = countResult[0]?.total || 0;

      return {
        groups,
        totalCount,
        hasMore: skip + groups.length < totalCount,
      };
    } catch (error) {
      throw new ApiError(500, `Group search failed: ${error.message}`);
    }
  }

  /**
   * Search institutions
   */
  static async searchInstitutionsByQuery(query, pagination = {}) {
    const { page = 1, limit = 15 } = pagination;
    const skip = (page - 1) * limit;

    try {
      const pipeline = [
        // Text search
        {
          $match: {
            $and: [{ $text: { $search: query } }, { isActive: true }],
          },
        },
        // Add relevance score
        {
          $addFields: {
            score: { $meta: "textScore" },
          },
        },
        // Sort by relevance
        {
          $sort: { score: { $meta: "textScore" } },
        },
        // Project required fields
        {
          $project: {
            name: 1,
            code: 1,
            type: 1,
            category: 1,
            location: 1,
            logo: 1,
            website: 1,
            postsCount: 1,
            score: 1,
          },
        },
        // Pagination
        { $skip: skip },
        { $limit: limit },
      ];

      const institutions = await Institution.aggregate(pipeline);

      // Get total count
      const countPipeline = [
        {
          $match: {
            $and: [{ $text: { $search: query } }, { isActive: true }],
          },
        },
        { $count: "total" },
      ];

      const countResult = await Institution.aggregate(countPipeline);
      const totalCount = countResult[0]?.total || 0;

      return {
        institutions,
        totalCount,
        hasMore: skip + institutions.length < totalCount,
      };
    } catch (error) {
      throw new ApiError(500, `Institution search failed: ${error.message}`);
    }
  }

  /**
   * Search departments
   */
  static async searchDepartmentsByQuery(query, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    try {
      const pipeline = [
        // Text search
        {
          $match: {
            $text: { $search: query },
          },
        },
        // Add relevance score
        {
          $addFields: {
            score: { $meta: "textScore" },
          },
        },
        // Sort by relevance
        {
          $sort: { score: { $meta: "textScore" } },
        },
        // Lookup institution info
        {
          $lookup: {
            from: "institutions",
            localField: "institution",
            foreignField: "_id",
            as: "institutionInfo",
          },
        },
        // Project required fields
        {
          $project: {
            name: 1,
            code: 1,
            description: 1,
            establishedYear: 1,
            postsCount: 1,
            score: 1,
            institution: {
              $arrayElemAt: [
                {
                  $map: {
                    input: "$institutionInfo",
                    as: "inst",
                    in: {
                      _id: "$$inst._id",
                      name: "$$inst.name",
                      code: "$$inst.code",
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        // Pagination
        { $skip: skip },
        { $limit: limit },
      ];

      const departments = await Department.aggregate(pipeline);

      // Get total count
      const countPipeline = [
        {
          $match: {
            $text: { $search: query },
          },
        },
        { $count: "total" },
      ];

      const countResult = await Department.aggregate(countPipeline);
      const totalCount = countResult[0]?.total || 0;

      return {
        departments,
        totalCount,
        hasMore: skip + departments.length < totalCount,
      };
    } catch (error) {
      throw new ApiError(500, `Department search failed: ${error.message}`);
    }
  }

  /**
   * Search comments with post context
   */
  static async searchCommentsByQuery(query, currentUserId, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    try {
      const pipeline = [
        // Text search
        {
          $match: {
            $and: [{ $text: { $search: query } }, { isDeleted: false }],
          },
        },
        // Add relevance score
        {
          $addFields: {
            score: { $meta: "textScore" },
          },
        },
        // Sort by relevance and recency
        {
          $sort: {
            score: { $meta: "textScore" },
            createdAt: -1,
          },
        },
        // Lookup post info (for context)
        {
          $lookup: {
            from: "posts",
            localField: "post",
            foreignField: "_id",
            as: "postInfo",
          },
        },
        // Lookup author info
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorInfo",
          },
        },
        // Filter out comments on private posts
        {
          $match: {
            "postInfo.isDeleted": false,
            $or: [
              { "postInfo.visibility": POST_VISIBILITY.PUBLIC },
              { "postInfo.author": currentUserId },
            ],
          },
        },
        // Project required fields
        {
          $project: {
            content: 1,
            createdAt: 1,
            likesCount: 1,
            score: 1,
            author: {
              $arrayElemAt: [
                {
                  $map: {
                    input: "$authorInfo",
                    as: "author",
                    in: {
                      _id: "$$author._id",
                      fullName: "$$author.fullName",
                      userName: "$$author.userName",
                      avatar: "$$author.avatar",
                    },
                  },
                },
                0,
              ],
            },
            post: {
              $arrayElemAt: [
                {
                  $map: {
                    input: "$postInfo",
                    as: "post",
                    in: {
                      _id: "$$post._id",
                      content: { $substr: ["$$post.content", 0, 100] }, // First 100 chars
                      author: "$$post.author",
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        // Pagination
        { $skip: skip },
        { $limit: limit },
      ];

      const comments = await Comment.aggregate(pipeline);

      // Get total count
      const countPipeline = [
        {
          $match: {
            $and: [{ $text: { $search: query } }, { isDeleted: false }],
          },
        },
        {
          $lookup: {
            from: "posts",
            localField: "post",
            foreignField: "_id",
            as: "postInfo",
          },
        },
        {
          $match: {
            "postInfo.isDeleted": false,
            $or: [
              { "postInfo.visibility": POST_VISIBILITY.PUBLIC },
              { "postInfo.author": currentUserId },
            ],
          },
        },
        { $count: "total" },
      ];

      const countResult = await Comment.aggregate(countPipeline);
      const totalCount = countResult[0]?.total || 0;

      return {
        comments,
        totalCount,
        hasMore: skip + comments.length < totalCount,
      };
    } catch (error) {
      throw new ApiError(500, `Comment search failed: ${error.message}`);
    }
  }

  /**
   * Generate search suggestions based on popular searches
   */
  static async generateSearchSuggestions(query, currentUserId) {
    if (!query || query.length < 1) {
      return {
        suggestions: [],
        pagination: {
          totalDocs: 0,
          limit: 5,
          page: 1,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        meta: {
          query: "",
        },
      };
    }

    try {
      // Simple suggestions based on existing data
      const suggestions = [];

      // User suggestions
      const userSuggestions = await User.find({
        $and: [
          {
            $or: [
              { fullName: { $regex: query, $options: "i" } },
              { userName: { $regex: query, $options: "i" } },
            ],
          },
          { accountStatus: ACCOUNT_STATUS.ACTIVE },
          { _id: { $ne: currentUserId } },
        ],
      })
        .limit(3)
        .select("fullName userName");

      userSuggestions.forEach((user) => {
        suggestions.push({
          type: "user",
          text: user.fullName,
          subtitle: `@${user.userName}`,
        });
      });

      // Group suggestions
      const groupSuggestions = await Group.find({
        $and: [
          { name: { $regex: query, $options: "i" } },
          { isDeleted: false },
          { privacy: GROUP_PRIVACY.PUBLIC },
        ],
      })
        .limit(2)
        .select("name membersCount");

      groupSuggestions.forEach((group) => {
        suggestions.push({
          type: "group",
          text: group.name,
          subtitle: `${group.membersCount} members`,
        });
      });

      const finalSuggestions = suggestions.slice(0, 5); // Max 5 suggestions

      return {
        suggestions: finalSuggestions,
        pagination: {
          totalDocs: finalSuggestions.length,
          limit: 5,
          page: 1,
          totalPages: Math.ceil(finalSuggestions.length / 5),
          hasNextPage: false,
          hasPrevPage: false,
        },
        meta: {
          query: query.trim(),
        },
      };
    } catch (error) {
      console.error("Search suggestions error:", error);
      return {
        suggestions: [],
        pagination: {
          totalDocs: 0,
          limit: 5,
          page: 1,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        meta: {
          query: query.trim(),
        },
      };
    }
  }

  /**
   * Helper method to calculate if more results are available
   */
  static _calculateHasMore(counts, page, limit) {
    const totalResults = Object.values(counts).reduce(
      (sum, count) => sum + count,
      0
    );
    return page * limit < totalResults;
  }
}

export default SearchService;
