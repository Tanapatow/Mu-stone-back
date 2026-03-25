export type SuccessResponse<T> = {
  success: true;
  message?: string;
  data?: T;
  path: string;
  timestamp: string;
};
