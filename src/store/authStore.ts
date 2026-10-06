import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Credentials = {
    idInstance: string;
    apiTokenInstance: string;
};

type AuthState = Credentials & {
    setCredentials: (credentials: Credentials) => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            idInstance: '',
            apiTokenInstance: '',
            setCredentials: ({ idInstance, apiTokenInstance }) =>
                set({ idInstance, apiTokenInstance }),
        }),
        {
            name: 'auth',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
