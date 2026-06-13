import { create } from 'zustand';
import type { Section, Settings, ContentPlanItem } from '../types';

interface AppState {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;

  contentPlan: ContentPlanItem[];
  setContentPlan: (items: ContentPlanItem[]) => void;
  clearContentPlan: () => void;

  notification: string | null;
  setNotification: (msg: string | null) => void;
  error: string | null;
  setError: (msg: string | null) => void;
}

const DEFAULT_SETTINGS: Settings = {
  aiProvider: 'mock',
  geminiApiKey: '',
  heygenApiKey: '',
  ttsProvider: 'ElevenLabs',
  ttsApiKey: '',
  imageApiKey: '',
};

export const useAppStore = create<AppState>((set) => ({
  activeSection: 'content-plan',
  setActiveSection: (section) => set({ activeSection: section, error: null }),
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  settings: { ...DEFAULT_SETTINGS },
  updateSettings: (partial) => set((state) => ({
    settings: { ...state.settings, ...partial },
    notification: 'Настройки сохранены',
  })),

  contentPlan: [],
  setContentPlan: (items) => set({ contentPlan: items }),
  clearContentPlan: () => set({ contentPlan: [] }),

  notification: null,
  setNotification: (msg) => set({ notification: msg }),
  error: null,
  setError: (msg) => set({ error: msg }),
}));
