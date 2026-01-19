'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useDraftStore } from '../stores/draftStore';

const DEBOUNCE_MS = 1000;

export function useDraftAutoSave() {
  const { setContent, setSaveStatus, markSaved, saveStatus, content } = useDraftStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>(content);

  const handleContentChange = useCallback((newContent: string) => {
    // Skip if content hasn't changed
    if (newContent === lastContentRef.current) return;
    lastContentRef.current = newContent;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Mark as unsaved immediately
    setSaveStatus('unsaved');

    // Debounce the actual save
    timeoutRef.current = setTimeout(() => {
      setSaveStatus('saving');
      setContent(newContent);
      markSaved();

      // Auto-hide "Saved" after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, DEBOUNCE_MS);
  }, [setContent, setSaveStatus, markSaved]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { handleContentChange, saveStatus, savedContent: content };
}
