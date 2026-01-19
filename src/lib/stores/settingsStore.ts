'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];

interface SettingsState {
  relays: string[];
  addRelay: (relay: string) => void;
  removeRelay: (relay: string) => void;
  resetRelays: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      relays: DEFAULT_RELAYS,
      addRelay: (relay) =>
        set((state) => ({
          relays: state.relays.includes(relay) ? state.relays : [...state.relays, relay],
        })),
      removeRelay: (relay) =>
        set((state) => ({
          relays: state.relays.filter((r) => r !== relay),
        })),
      resetRelays: () => set({ relays: DEFAULT_RELAYS }),
    }),
    {
      name: 'ned-settings',
    }
  )
);

export { DEFAULT_RELAYS };
