/**
 * RideLog App Store (Zustand)
 * Auth mode, settings, and global app state
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AppSettings, StorageMode, User } from "@/types";
import { loadSettings, saveSettings } from "@/lib/db/indexeddb";

interface AppStore {
  // Settings
  settings: AppSettings;
  isSettingsLoaded: boolean;

  // Auth
  user: User | null;
  isAuthLoading: boolean;

  // UI state
  isInstallPromptAvailable: boolean;
  installPrompt: unknown | null;

  // Actions
  initSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  setStorageMode: (mode: StorageMode) => void;
  setUser: (user: User | null) => void;
  setInstallPrompt: (prompt: unknown) => void;
  triggerInstall: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  storageMode: "guest",
  distanceUnit: "km",
  speedUnit: "kmh",
  theme: "dark",
  gpsInterval: 1000,
  keepScreenOn: true,
  notifications: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isSettingsLoaded: false,
      user: null,
      isAuthLoading: false,
      isInstallPromptAvailable: false,
      installPrompt: null,

      initSettings: async () => {
        try {
          const settings = await loadSettings();
          set({ settings, isSettingsLoaded: true });
        } catch {
          set({ settings: defaultSettings, isSettingsLoaded: true });
        }
      },

      updateSettings: async (updates) => {
        const newSettings = { ...get().settings, ...updates };
        set({ settings: newSettings });
        await saveSettings(updates);
      },

      setStorageMode: (mode) => {
        set((s) => ({ settings: { ...s.settings, storageMode: mode } }));
        saveSettings({ storageMode: mode }).catch(console.error);
      },

      setUser: (user) => set({ user }),

      setInstallPrompt: (prompt) =>
        set({ installPrompt: prompt, isInstallPromptAvailable: true }),

      triggerInstall: async () => {
        const { installPrompt } = get();
        if (!installPrompt) return;
        const prompt = installPrompt as { prompt: () => void; userChoice: Promise<{ outcome: string }> };
        prompt.prompt();
        const result = await prompt.userChoice;
        if (result.outcome === "accepted") {
          set({ installPrompt: null, isInstallPromptAvailable: false });
        }
      },
    }),
    {
      name: "ridelog-app-store",
      storage: createJSONStorage(() =>
        typeof localStorage !== "undefined" ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      partialize: (state) => ({
        settings: state.settings,
        user: state.user,
      }),
    }
  )
);
