'use client';

import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import {
  $applyNodeReplacement,
  $getNodeByKey,
  DecoratorNode,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export interface NpubPayload {
  npub: string;
  key?: NodeKey;
}

export type SerializedNpubNode = Spread<
  {
    npub: string;
  },
  SerializedLexicalNode
>;

function getDisplayText(npub: string): string {
  if (npub.length < 8) return npub;
  return `npub...${npub.slice(-4)}`;
}

function NpubComponent({
  npub,
  nodeKey,
}: {
  npub: string;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editNpub, setEditNpub] = useState(npub);
  const containerRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const displayText = getDisplayText(npub);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditNpub(npub);
    setIsEditing(true);
  }, [npub]);

  const handleSave = useCallback(() => {
    const trimmedNpub = editNpub.trim();
    if (trimmedNpub && /^npub1[a-z0-9]{58}$/i.test(trimmedNpub)) {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isNpubNode(node)) {
          const newNode = $createNpubNode({ npub: trimmedNpub });
          node.replace(newNode);
        }
      });
    }
    setIsEditing(false);
  }, [editor, nodeKey, editNpub]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditNpub(npub);
  }, [npub]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  // Close popup when clicking outside
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        handleCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, handleCancel]);

  return (
    <span ref={containerRef} className="relative inline-flex items-center gap-1">
      <span
        className="text-blue-500 cursor-default"
        title={npub}
      >
        {displayText}
      </span>
      <button
        onClick={handleEditClick}
        className="inline-flex items-center justify-center w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
        title="Edit npub"
        aria-label="Edit npub"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>

      {isEditing && (
        <div
          ref={popupRef}
          className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-3 min-w-80"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-2">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Npub
              </label>
              <input
                type="text"
                value={editNpub}
                onChange={(e) => setEditNpub(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="npub1..."
                className="w-full px-2 py-1 text-sm border border-zinc-200 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 font-mono"
                autoFocus
                autoComplete="off"
              />
            </div>
            <div className="flex gap-2 justify-end mt-1">
              <button
                onClick={handleCancel}
                className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

export class NpubNode extends DecoratorNode<ReactNode> {
  __npub: string;

  static getType(): string {
    return 'npub';
  }

  static clone(node: NpubNode): NpubNode {
    return new NpubNode(node.__npub, node.__key);
  }

  static importJSON(serializedNode: SerializedNpubNode): NpubNode {
    const { npub } = serializedNode;
    return $createNpubNode({ npub });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        const npub = domNode.getAttribute('data-npub');
        if (!npub) return null;
        return {
          conversion: () => ({
            node: $createNpubNode({ npub }),
          }),
          priority: 1,
        };
      },
    };
  }

  constructor(npub: string, key?: NodeKey) {
    super(key);
    this.__npub = npub;
  }

  exportJSON(): SerializedNpubNode {
    return {
      type: 'npub',
      version: 1,
      npub: this.__npub,
    };
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.setAttribute('data-npub', this.__npub);
    span.textContent = getDisplayText(this.__npub);
    return { element: span };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.npub;
    if (className) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getNpub(): string {
    return this.__npub;
  }

  getTextContent(): string {
    return this.__npub;
  }

  decorate(): ReactNode {
    return (
      <NpubComponent
        npub={this.__npub}
        nodeKey={this.__key}
      />
    );
  }

  isInline(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }
}

export function $createNpubNode({ npub, key }: NpubPayload): NpubNode {
  return $applyNodeReplacement(new NpubNode(npub, key));
}

export function $isNpubNode(node: LexicalNode | null | undefined): node is NpubNode {
  return node instanceof NpubNode;
}
