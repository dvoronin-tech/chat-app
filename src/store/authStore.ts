import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Credentials = {
    idInstance: string;
    apiTokenInstance: string;
};

type AuthState = {
    credentials: Credentials | null;
    setCredentials: (credentials: Credentials) => void;
};

export const useAuthStore = create<AuthState>()(
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
);
