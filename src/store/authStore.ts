import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import type { GreenApiCredentials } from '../api/greenApi.types';

type AuthState = {
    credentials: GreenApiCredentials | null;
    setCredentials: (credentials: GreenApiCredentials) => void;
};

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set) => ({
                credentials: null,
                setCredentials: ({ idInstance, apiTokenInstance }) =>
                    set({ credentials: { apiTokenInstance, idInstance } }),
            }),
            {
                name: 'auth',
                storage: createJSONStorage(() => localStorage),
            },
        ),
        { name: 'auth' },
    ),
);
