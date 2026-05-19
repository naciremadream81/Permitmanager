import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'permitpro_access_token';
const REFRESH_TOKEN_KEY = 'permitpro_refresh_token';

export async function saveAuthTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAuthTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearAuthTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function refreshAccessToken(): Promise<string | null> {
  const tokens = await getAuthTokens();
  if (!tokens) return null;

  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  try {
    const response = await fetch(`${apiUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!response.ok) {
      await clearAuthTokens();
      return null;
    }

    const data = (await response.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    await saveAuthTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}
