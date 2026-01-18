'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  type LexicalNode,
} from 'lexical';
import { $createNpubNode } from '../nodes/NpubNode';
import { $createNprofileNode } from '../nodes/NprofileNode';
import { $createNeventNode } from '../nodes/NeventNode';
import { $createNaddrNode } from '../nodes/NaddrNode';

// Nostr bech32 entity patterns
const NPUB_REGEX = /^npub1[a-z0-9]{58}$/i;
const NPROFILE_REGEX = /^nprofile1[a-z0-9]+$/i;
const NEVENT_REGEX = /^nevent1[a-z0-9]+$/i;
const NADDR_REGEX = /^naddr1[a-z0-9]+$/i;

function createNostrNode(text: string): LexicalNode | null {
  if (NPUB_REGEX.test(text)) {
    return $createNpubNode({ npub: text });
  }
  if (NPROFILE_REGEX.test(text)) {
    return $createNprofileNode({ nprofile: text });
  }
  if (NEVENT_REGEX.test(text)) {
    return $createNeventNode({ nevent: text });
  }
  if (NADDR_REGEX.test(text)) {
    return $createNaddrNode({ naddr: text });
  }
  return null;
}

export default function NostrPastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const text = clipboardData.getData('text/plain').trim();

        // Try to create a Nostr node from the pasted text
        const node = createNostrNode(text);
        if (!node) {
          return false;
        }

        // Prevent default paste behavior
        event.preventDefault();

        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          selection.insertNodes([node]);
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
