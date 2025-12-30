import { AxiosError } from "axios";

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;
    
    if (apiError?.errors && apiError.errors.length > 0) {
      // Return first validation error
      return apiError.errors[0].message;
    }
    
    return apiError?.message || error.message || "An error occurred";
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unexpected error occurred";
};

export const getFieldErrors = (error: unknown): Record<string, string> => {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;
    
    if (apiError?.errors) {
      return apiError.errors.reduce((acc, err) => {
        acc[err.field] = err.message;
        return acc;
      }, {} as Record<string, string>);
    }
  }
  
  return {};
};
