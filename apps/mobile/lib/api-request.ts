import { getAuthTokens, refreshAccessToken } from './auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function request(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<Response> {
  const tokens = await getAuthTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  if (response.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request(path, options, false);
    }
  }

  return response;
}
