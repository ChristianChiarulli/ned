'use client';

import { createContext, useContext } from 'react';

/**
 * Profile data returned by the lookup callback
 */
export interface NostrProfile {
  name?: string;
  picture?: string;
  nip05?: string;
}

/**
 * Callback signature for looking up profile data
 */
export type ProfileLookupFn = (npub: string) => Promise<NostrProfile | null>;

/**
 * Editor context type containing configuration callbacks
 */
export interface EditorContextType {
  onProfileLookup?: ProfileLookupFn;
}

/**
 * Context for passing editor configuration to nested components
 */
export const EditorContext = createContext<EditorContextType>({});

/**
 * Hook to access editor context
 */
export function useEditorContext(): EditorContextType {
  return useContext(EditorContext);
}
