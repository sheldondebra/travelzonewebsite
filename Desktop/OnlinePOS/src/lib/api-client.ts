export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
};

export async function parseApiResponse<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new Error(json.message ?? "Request failed");
  }

  return json.data as T;
}
