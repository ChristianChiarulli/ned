'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from 'lexical';
import { $createNpubNode } from '../nodes/NpubNode';

// Nostr public key format: npub1 followed by 58 bech32 characters
const NPUB_REGEX = /^npub1[a-z0-9]{58}$/i;

export default function NpubPastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const text = clipboardData.getData('text/plain').trim();

        // Check if the pasted text is a valid npub
        if (!NPUB_REGEX.test(text)) {
          return false;
        }

        // Prevent default paste behavior
        event.preventDefault();

        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          // Create and insert the npub node
          const npubNode = $createNpubNode({ npub: text });
          selection.insertNodes([npubNode]);
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
