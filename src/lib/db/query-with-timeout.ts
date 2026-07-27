const DEFAULT_QUERY_TIMEOUT_MS = 4000;

export async function withQueryTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = DEFAULT_QUERY_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  // Swallow late rejections so a timed-out DB call cannot crash the request.
  const guarded = promise.then(
    (value) => value,
    () => fallback,
  );

  try {
    return await Promise.race([
      guarded,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
