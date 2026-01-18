'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical';
import { useCallback, useEffect, useState } from 'react';

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        setIsBold(selection.hasFormat('bold'));
        setIsItalic(selection.hasFormat('italic'));
        setIsUnderline(selection.hasFormat('underline'));
        setIsStrikethrough(selection.hasFormat('strikethrough'));
      }
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatButton = (
    label: string,
    format: 'bold' | 'italic' | 'underline' | 'strikethrough',
    isActive: boolean,
    shortcut: string
  ) => (
    <button
      type="button"
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
        isActive
          ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      }`}
      title={`${label} (${shortcut})`}
      aria-pressed={isActive}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1 p-2 border-b border-zinc-200 dark:border-zinc-700">
      {formatButton('B', 'bold', isBold, 'Ctrl+B')}
      {formatButton('I', 'italic', isItalic, 'Ctrl+I')}
      {formatButton('U', 'underline', isUnderline, 'Ctrl+U')}
      {formatButton('S', 'strikethrough', isStrikethrough, 'Ctrl+Shift+S')}
    </div>
  );
}
