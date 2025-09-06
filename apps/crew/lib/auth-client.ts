import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    baseURL: process.env.EXPO_PUBLIC_AUTH_BASE_URL,
    plugins: [
      expoClient({
        scheme: 'dayof',
        storagePrefix: 'dayof-crew',
        storage: SecureStore,
      }),
    ],
  }
);
