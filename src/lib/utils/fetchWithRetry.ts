/**
 * Fetch with automatic retry logic for network failures
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If successful, return the response
      return response;
    } catch (error) {
      lastError = error as Error;

      // Check if it's a network error that we should retry
      const isNetworkError =
        error instanceof TypeError &&
        (error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('ERR_NETWORK'));

      const isAbortError =
        error instanceof Error && error.name === 'AbortError';

      // Don't retry if it's not a network error or if we've exhausted retries
      if (!isNetworkError || attempt === maxRetries) {
        throw error;
      }

      // Log the retry attempt
      console.warn(
        `Network request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${retryDelay}ms...`,
        { url, error: error instanceof Error ? error.message : 'Unknown error' }
      );

      // Wait before retrying with exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelay * Math.pow(2, attempt))
      );
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Creates a debounced version of an async function
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let activePromise: Promise<any> | null = null;

  return (...args: Parameters<T>) => {
    // Clear any pending timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout
    timeoutId = setTimeout(async () => {
      // If there's an active request, don't start a new one
      if (activePromise) {
        return;
      }

      try {
        activePromise = func(...args);
        await activePromise;
      } finally {
        activePromise = null;
      }
    }, delay);
  };
}
