const DEFAULT_QUERY_TIMEOUT_MS = 4000;

export async function withQueryTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = DEFAULT_QUERY_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
