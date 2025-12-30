import { Request } from "express";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Extract pagination parameters from request query
 */
export const getPaginationParams = (req: Request): PaginationOptions => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

  // Validate and sanitize
  const validatedPage = Math.max(1, page);
  const validatedLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

  return {
    page: validatedPage,
    limit: validatedLimit,
    sortBy,
    sortOrder,
  };
};

/**
 * Calculate skip value for MongoDB queries
 */
export const getSkip = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Build sort object for MongoDB queries
 */
export const getSortObject = (
  sortBy: string,
  sortOrder: "asc" | "desc"
): Record<string, 1 | -1> => {
  return { [sortBy]: sortOrder === "asc" ? 1 : -1 };
};

/**
 * Create pagination result object
 */
export const createPaginationResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Helper function to paginate any MongoDB query
 */
export const paginate = async <T>(
  query: any,
  options: PaginationOptions
): Promise<PaginationResult<T>> => {
  const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = options;

  const skip = getSkip(page, limit);
  const sort = getSortObject(sortBy, sortOrder);

  // Execute count and find queries in parallel
  const [total, data] = await Promise.all([
    query.model.countDocuments(query.getFilter()),
    query.skip(skip).limit(limit).sort(sort).exec(),
  ]);

  return createPaginationResult<T>(data, total, page, limit);
};
