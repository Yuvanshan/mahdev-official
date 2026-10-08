type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions extends RequestInit {
  method?: ApiMethod;
  params?: Record<string, string | number | boolean | undefined>;
}

function getApiBaseUrl(): string {
  const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isLocalDev) {
    return 'http://localhost:4000/api';
  }
  return '/api';
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { params, ...requestInit } = options;
  const query = params
    ? `?${new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString()}`
    : '';

  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}${query}`;

  const response = await fetch(url, {
    ...requestInit,
    headers: {
      'Content-Type': 'application/json',
      ...(requestInit.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((payload as { error?: string }).error || `Request failed with status ${response.status}`);
  }

  return payload as T;
}
