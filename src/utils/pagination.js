/**
 * ====================================
 * PAGINATION UTILITIES
 * ====================================
 *
 * Enhanced pagination utilities for consistent pagination
 * across all search endpoints with cursor-based support.
 */

/**
 * Standard pagination parameters validation
 */
export const validatePaginationParams = (page, limit, maxLimit = 50) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;

  if (pageNum < 1) {
    throw new Error("Page must be >= 1");
  }

  if (limitNum < 1 || limitNum > maxLimit) {
    throw new Error(`Limit must be between 1 and ${maxLimit}`);
  }

  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };
};

/**
 * Create pagination metadata for responses
 */
export const createPaginationMeta = (
  page,
  limit,
  totalCount,
  hasMore = null
) => {
  const totalPages = Math.ceil(totalCount / limit);

  return {
    currentPage: page,
    limit,
    totalCount,
    totalPages,
    hasMore: hasMore !== null ? hasMore : page < totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
};

/**
 * Cursor-based pagination for large datasets
 * Uses _id and score for consistent ordering
 */
export const createCursorPagination = (results, limit, sortField = "_id") => {
  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;

  let nextCursor = null;
  let prevCursor = null;

  if (items.length > 0) {
    // Next cursor is the last item's sort field value
    nextCursor = hasMore ? items[items.length - 1][sortField] : null;

    // Previous cursor is the first item's sort field value
    prevCursor = items[0][sortField];
  }

  return {
    items,
    pagination: {
      hasMore,
      hasPrevious: !!prevCursor,
      nextCursor,
      prevCursor,
      count: items.length,
    },
  };
};

/**
 * Build cursor-based MongoDB query
 */
export const buildCursorQuery = (
  baseQuery,
  cursor,
  sortField = "_id",
  sortDirection = 1
) => {
  if (!cursor) {
    return baseQuery;
  }

  const cursorQuery =
    sortDirection === 1
      ? { [sortField]: { $gt: cursor } }
      : { [sortField]: { $lt: cursor } };

  return {
    $and: [baseQuery, cursorQuery],
  };
};

/**
 * Performance monitoring wrapper
 */
export const withPerformanceMonitoring = async (
  operation,
  operationName = "operation"
) => {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    // Log slow queries (> 1000ms)
    if (duration > 1000) {
      console.warn(`⚠️ Slow ${operationName}: ${duration}ms`);
    }

    return {
      ...result,
      performance: {
        duration,
        operationName,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `❌ ${operationName} failed after ${duration}ms:`,
      error.message
    );
    throw error;
  }
};

/**
 * Search result aggregation helper
 */
export const aggregateSearchResults = (results, counts) => {
  const totalCount = Object.values(counts).reduce(
    (sum, count) => sum + count,
    0
  );

  return {
    results,
    counts: {
      ...counts,
      total: totalCount,
    },
    isEmpty: totalCount === 0,
    hasResults: totalCount > 0,
  };
};

/**
 * Cache key generator for search results
 */
export const generateSearchCacheKey = (
  query,
  filters = {},
  pagination = {}
) => {
  const normalizedQuery = query.toLowerCase().trim();
  const filterString = Object.keys(filters)
    .sort()
    .map((key) => `${key}:${filters[key]}`)
    .join("|");

  const paginationString = `page:${pagination.page || 1}|limit:${pagination.limit || 20}`;

  return `search:${normalizedQuery}:${filterString}:${paginationString}`;
};

/**
 * Search result highlighting helper
 */
export const highlightSearchTerms = (text, searchQuery, maxLength = 200) => {
  if (!text || !searchQuery) return text;

  const query = searchQuery.toLowerCase();
  const lowerText = text.toLowerCase();
  const queryIndex = lowerText.indexOf(query);

  if (queryIndex === -1) {
    // No match found, return truncated text
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  // Calculate excerpt boundaries
  const start = Math.max(0, queryIndex - 50);
  const end = Math.min(text.length, queryIndex + query.length + 50);

  let excerpt = text.substring(start, end);

  // Add ellipsis if truncated
  if (start > 0) excerpt = "..." + excerpt;
  if (end < text.length) excerpt = excerpt + "...";

  // Highlight the search term (case-insensitive)
  const regex = new RegExp(`(${query})`, "gi");
  excerpt = excerpt.replace(regex, "<mark>$1</mark>");

  return excerpt;
};

/**
 * Search analytics helper
 */
export const trackSearchAnalytics = (
  query,
  resultCounts,
  searchTime,
  userId
) => {
  // In a real app, this would send to analytics service
  const analytics = {
    query: query.toLowerCase().trim(),
    resultCounts,
    searchTime,
    userId,
    timestamp: new Date(),
    hasResults: Object.values(resultCounts).some((count) => count > 0),
  };

  // Log for now (replace with actual analytics service)
  console.log("📊 Search Analytics:", {
    query: analytics.query,
    totalResults: Object.values(resultCounts).reduce(
      (sum, count) => sum + count,
      0
    ),
    searchTime: `${searchTime}ms`,
    hasResults: analytics.hasResults,
  });

  return analytics;
};
