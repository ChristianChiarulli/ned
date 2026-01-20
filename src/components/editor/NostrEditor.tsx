'use client';

import { useMemo, useImperativeHandle, forwardRef, useState, useCallback, useRef, useEffect } from 'react';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {
  $convertToMarkdownString,
  $convertFromMarkdownString,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
} from '@lexical/markdown';
import { defineExtension, $getRoot } from 'lexical';
import type { EditorState, LexicalEditor } from 'lexical';

import { EditorContext, type ProfileLookupFn, type NoteLookupFn } from './context/EditorContext';

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
import ToolbarPlugin from './plugins/ToolbarPlugin';
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
  onProfileLookup?: ProfileLookupFn;
  onNoteLookup?: NoteLookupFn;
  toolbarContainer?: HTMLElement | null;
}

export interface NostrEditorHandle {
  getMarkdown: () => string;
}

// All transformers for markdown conversion
const ALL_TRANSFORMERS = [
  IMAGE,
  LINK,
  ...NOSTR_TRANSFORMERS,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
];

// Inner component to access editor context and handle raw mode
function EditorInner({
  editorRef,
  placeholder,
  onChange,
  toolbarContainer,
  initialMarkdown,
}: {
  editorRef: React.RefObject<NostrEditorHandle | null>;
  placeholder: string;
  onChange?: (editorState: EditorState) => void;
  toolbarContainer?: HTMLElement | null;
  initialMarkdown?: string;
}) {
  const [editor] = useLexicalComposerContext();
  const [isRawMode, setIsRawMode] = useState(false);
  const [rawMarkdown, setRawMarkdown] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(editorRef, () => ({
    getMarkdown: () => {
      if (isRawMode) {
        return rawMarkdown;
      }
      let markdown = '';
      editor.getEditorState().read(() => {
        markdown = $convertToMarkdownString(ALL_TRANSFORMERS, undefined, false);
      });
      return markdown;
    },
  }));

  const handleToggleRawMode = useCallback(() => {
    if (isRawMode) {
      // Switching from raw to rich: parse markdown into editor
      editor.update(() => {
        $convertFromMarkdownString(rawMarkdown, ALL_TRANSFORMERS, undefined, false);
      });
      setIsRawMode(false);
    } else {
      // Switching from rich to raw: get markdown from editor
      editor.getEditorState().read(() => {
        const markdown = $convertToMarkdownString(ALL_TRANSFORMERS, undefined, false);
        setRawMarkdown(markdown);
      });
      setIsRawMode(true);
    }
  }, [editor, isRawMode, rawMarkdown]);

  // Focus textarea when switching to raw mode
  useEffect(() => {
    if (isRawMode && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isRawMode]);

  // Handle raw markdown changes and trigger onChange
  const handleRawChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value;
    setRawMarkdown(newMarkdown);

    // Update editor state in background so onChange fires
    if (onChange) {
      editor.update(() => {
        $convertFromMarkdownString(newMarkdown, ALL_TRANSFORMERS, undefined, false);
      });
    }
  }, [editor, onChange]);

  return (
    <>
      <LexicalErrorBoundary onError={(error) => console.error('Lexical error:', error)}>
        {isRawMode ? (
          <textarea
            ref={textareaRef}
            value={rawMarkdown}
            onChange={handleRawChange}
            className="min-h-full flex-auto px-4 py-8 pb-[30%] outline-none text-zinc-900 dark:text-zinc-100 bg-transparent resize-none font-mono text-sm"
            placeholder={placeholder}
          />
        ) : (
          <ContentEditable
            className="min-h-full flex-auto px-4 py-8 pb-[30%] outline-none text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-source-serif-4)] text-lg leading-relaxed"
            aria-placeholder={placeholder}
            placeholder={
              <div className="absolute top-8 left-4 text-zinc-400 dark:text-zinc-500 pointer-events-none select-none font-[family-name:var(--font-source-serif-4)]">
                {placeholder}
              </div>
            }
          />
        )}
      </LexicalErrorBoundary>
      {onChange && (
        <OnChangePlugin
          onChange={(editorState) => onChange(editorState)}
        />
      )}
      {toolbarContainer && (
        <ToolbarPlugin
          portalContainer={toolbarContainer}
          isRawMode={isRawMode}
          onToggleRawMode={handleToggleRawMode}
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
      <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />
    </>
  );
}

const NostrEditor = forwardRef<NostrEditorHandle, NostrEditorProps>(function NostrEditor(
  {
    placeholder = 'Start writing...',
    onChange,
    autoFocus = false,
    initialMarkdown,
    onProfileLookup,
    onNoteLookup,
    toolbarContainer,
  },
  ref
) {
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

  const editorContextValue = useMemo(
    () => ({ onProfileLookup, onNoteLookup }),
    [onProfileLookup, onNoteLookup]
  );

  return (
    <EditorContext.Provider value={editorContextValue}>
      <LexicalExtensionComposer extension={editorExtension} contentEditable={null}>
        <div className="relative flex-1 min-h-full flex flex-col">
          <div className="relative flex-1 flex flex-col">
            <EditorInner
              editorRef={ref as React.RefObject<NostrEditorHandle | null>}
              placeholder={placeholder}
              onChange={onChange}
              toolbarContainer={toolbarContainer}
              initialMarkdown={initialMarkdown}
            />
          </div>
        </div>
      </LexicalExtensionComposer>
    </EditorContext.Provider>
  );
});

export default NostrEditor;
