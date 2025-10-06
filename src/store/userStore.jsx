import { create } from 'zustand';

export const useUserStore = create((set) => ({

    user: {
        id: null,
        name: null,
        email: null,
        roleId: null,
        roleName: null,
    },

    setUser: (data) => set({ user: data }),

    clearUser: () => set({
        user: { id: null, name: null, email: null, roleId: null, roleName: null }
    }),
}));

