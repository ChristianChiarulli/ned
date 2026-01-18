'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  PASTE_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from 'lexical';
import { $createLinkNode } from '../nodes/LinkNode';

const URL_REGEX = /^https?:\/\/[^\s]+$/;

function isValidUrl(text: string): boolean {
  return URL_REGEX.test(text.trim());
}

export default function LinkPastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const text = clipboardData.getData('text/plain').trim();

        // Only handle if it's a valid URL
        if (!isValidUrl(text)) return false;

        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        event.preventDefault();

        const linkNode = $createLinkNode({ url: text });
        selection.insertNodes([linkNode]);

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
