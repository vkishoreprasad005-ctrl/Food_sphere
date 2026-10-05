export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

const getAuthToken = () => localStorage.getItem('foodsphere_token');

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        data: null,
        error: data?.error || `Request failed with status ${res.status}`,
      };
    }

    return { data, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || 'Network communication error',
    };
  }
}
