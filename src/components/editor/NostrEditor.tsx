'use client';

import { useMemo } from 'react';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
} from '@lexical/markdown';
import { defineExtension } from 'lexical';
import type { EditorState } from 'lexical';

// Extensions
import { RichTextExtension } from '@lexical/rich-text';
import { HistoryExtension } from '@lexical/history';
import { ListExtension } from '@lexical/list';
import { CodeExtension } from '@lexical/code';
import {
  AutoFocusExtension,
  TabIndentationExtension,
  HorizontalRuleExtension,
} from '@lexical/extension';

import theme from './themes/default';
import ClickOutsidePlugin from './plugins/ClickOutsidePlugin';
import ScrollCenterCurrentLinePlugin from './plugins/ScrollCenterCurrentLinePlugin';
import ListBackspacePlugin from './plugins/ListBackspacePlugin';
import CodeBlockShortcutPlugin from './plugins/CodeBlockShortcutPlugin';
import InitialContentPlugin from './plugins/InitialContentPlugin';
import ImagePastePlugin from './plugins/ImagePastePlugin';
import LinkPastePlugin from './plugins/LinkPastePlugin';
import NostrPastePlugin from './plugins/NostrPastePlugin';
import { ImageNode } from './nodes/ImageNode';
import { LinkNode } from './nodes/LinkNode';
import { NpubNode } from './nodes/NpubNode';
import { NprofileNode } from './nodes/NprofileNode';
import { NeventNode } from './nodes/NeventNode';
import { NaddrNode } from './nodes/NaddrNode';
import { IMAGE } from './transformers/ImageTransformer';
import { LINK } from './transformers/LinkTransformer';
import { NOSTR_TRANSFORMERS } from './transformers/NostrTransformers';

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
        nodes: [ImageNode, LinkNode, NpubNode, NprofileNode, NeventNode, NaddrNode],
        onError: (error: Error) => console.error('Lexical error:', error),
        dependencies: [
          RichTextExtension,
          HistoryExtension,
          ListExtension,
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
      <div className="relative">
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
          <LinkPastePlugin />
          <NostrPastePlugin />
          {initialMarkdown && <InitialContentPlugin markdown={initialMarkdown} />}
          <ScrollCenterCurrentLinePlugin />
          <ListBackspacePlugin />
          <CodeBlockShortcutPlugin />
          <MarkdownShortcutPlugin
            transformers={[
              IMAGE,
              LINK,
              ...NOSTR_TRANSFORMERS,
              ...ELEMENT_TRANSFORMERS,
              ...MULTILINE_ELEMENT_TRANSFORMERS,
              ...TEXT_FORMAT_TRANSFORMERS,
            ]}
          />
        </div>
      </div>
    </LexicalExtensionComposer>
  );
}
