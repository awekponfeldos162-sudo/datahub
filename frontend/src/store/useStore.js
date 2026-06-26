import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      updateUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),
    }),
    {
      name: 'datahub-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const useUIStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      darkMode: false,
      activePeriod: '30d',

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleDarkMode: () => set((state) => {
        const dark = !state.darkMode;
        document.documentElement.classList.toggle('dark', dark);
        return { darkMode: dark };
      }),
      setActivePeriod: (period) => set({ activePeriod: period }),
    }),
    {
      name: 'datahub-ui',
      partialize: (state) => ({ darkMode: state.darkMode, sidebarOpen: state.sidebarOpen }),
    }
  )
);
