export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message: string;
};

export function getApiData<T>(payload: ApiResponse<T>): T {
  if (!payload.success || payload.data === undefined) {
    throw new Error(payload.message ?? "Request failed");
  }
  return payload.data;
}
