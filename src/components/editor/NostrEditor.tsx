'use client';

import { useMemo } from 'react';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { defineExtension, configExtension } from 'lexical';
import type { EditorState } from 'lexical';

// Extensions
import { RichTextExtension } from '@lexical/rich-text';
import { HistoryExtension } from '@lexical/history';
import { ListExtension } from '@lexical/list';
import { LinkExtension } from '@lexical/link';
import { CodeExtension } from '@lexical/code';
import {
  AutoFocusExtension,
  TabIndentationExtension,
  HorizontalRuleExtension,
} from '@lexical/extension';

import theme from './themes/default';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import ClickOutsidePlugin from './plugins/ClickOutsidePlugin';
import ScrollCenterCurrentLinePlugin from './plugins/ScrollCenterCurrentLinePlugin';
import ListBackspacePlugin from './plugins/ListBackspacePlugin';
import CodeBlockShortcutPlugin from './plugins/CodeBlockShortcutPlugin';
import InitialContentPlugin from './plugins/InitialContentPlugin';
import ImagePastePlugin from './plugins/ImagePastePlugin';
import { ImageNode } from './nodes/ImageNode';
import { IMAGE } from './transformers/ImageTransformer';

interface NostrEditorProps {
  placeholder?: string;
  onChange?: (editorState: EditorState) => void;
  autoFocus?: boolean;
  initialMarkdown?: string;
}

export default function NostrEditor({
  placeholder = 'Start writing...',
  onChange,
  autoFocus = true,
  initialMarkdown,
}: NostrEditorProps) {
  const editorExtension = useMemo(
    () =>
      defineExtension({
        name: 'NostrEditor',
        namespace: 'NostrEditor',
        theme,
        nodes: [ImageNode],
        onError: (error: Error) => console.error('Lexical error:', error),
        dependencies: [
          RichTextExtension,
          HistoryExtension,
          ListExtension,
          LinkExtension,
          CodeExtension,
          HorizontalRuleExtension,
          TabIndentationExtension,
          ...(autoFocus ? [AutoFocusExtension] : []),
        ],
      }),
    [autoFocus]
  );

  return (
    <LexicalExtensionComposer extension={editorExtension} contentEditable={null}>
      <div className="relative border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900">
        <ToolbarPlugin />
        <div className="relative">
          <LexicalErrorBoundary onError={(error) => console.error('Lexical error:', error)}>
            <ContentEditable
              className="flex-1 px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100"
              aria-placeholder={placeholder}
              placeholder={
                <div className="absolute top-3 left-4 text-zinc-400 dark:text-zinc-500 pointer-events-none select-none">
                  {placeholder}
                </div>
              }
            />
          </LexicalErrorBoundary>
          {onChange && (
            <OnChangePlugin
              onChange={(editorState) => onChange(editorState)}
            />
          )}
          <ClickOutsidePlugin />
          <ImagePastePlugin />
          {initialMarkdown && <InitialContentPlugin markdown={initialMarkdown} />}
          <ScrollCenterCurrentLinePlugin />
          <ListBackspacePlugin />
          <CodeBlockShortcutPlugin />
          <MarkdownShortcutPlugin transformers={[IMAGE, ...TRANSFORMERS]} />
        </div>
      </div>
    </LexicalExtensionComposer>
  );
}
