'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

interface DraftState {
  content: string;
  lastSaved: number | null;
  saveStatus: SaveStatus;

  setContent: (content: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  markSaved: () => void;
  clearDraft: () => void;
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      content: '',
      lastSaved: null,
      saveStatus: 'idle',

      setContent: (content) => set({ content, saveStatus: 'unsaved' }),
      setSaveStatus: (status) => set({ saveStatus: status }),
      markSaved: () => set({
        saveStatus: 'saved',
        lastSaved: Date.now()
      }),
      clearDraft: () => set({
        content: '',
        lastSaved: null,
        saveStatus: 'idle'
      }),
    }),
    {
      name: 'ned-draft',
      partialize: (state) => ({
        content: state.content,
        lastSaved: state.lastSaved
      }),
    }
  )
);
