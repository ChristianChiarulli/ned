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

export interface NaddrPayload {
  naddr: string;
  key?: NodeKey;
}

export type SerializedNaddrNode = Spread<
  {
    naddr: string;
  },
  SerializedLexicalNode
>;

function getDisplayText(naddr: string): string {
  if (naddr.length < 9) return naddr;
  return `naddr...${naddr.slice(-4)}`;
}

function NaddrComponent({
  naddr,
  nodeKey,
}: {
  naddr: string;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(naddr);
  const containerRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const displayText = getDisplayText(naddr);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditValue(naddr);
    setIsEditing(true);
  }, [naddr]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && /^naddr1[a-z0-9]+$/i.test(trimmed)) {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isNaddrNode(node)) {
          const newNode = $createNaddrNode({ naddr: trimmed });
          node.replace(newNode);
        }
      });
    }
    setIsEditing(false);
  }, [editor, nodeKey, editValue]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(naddr);
  }, [naddr]);

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
        title={naddr}
      >
        {displayText}
      </span>
      <button
        onClick={handleEditClick}
        className="inline-flex items-center justify-center w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
        title="Edit naddr"
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
                Naddr
              </label>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="naddr1..."
                className="w-full px-2 py-1 text-sm border border-zinc-200 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 font-mono"
                autoFocus
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

export class NaddrNode extends DecoratorNode<ReactNode> {
  __naddr: string;

  static getType(): string {
    return 'naddr';
  }

  static clone(node: NaddrNode): NaddrNode {
    return new NaddrNode(node.__naddr, node.__key);
  }

  static importJSON(serializedNode: SerializedNaddrNode): NaddrNode {
    const { naddr } = serializedNode;
    return $createNaddrNode({ naddr });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        const naddr = domNode.getAttribute('data-naddr');
        if (!naddr) return null;
        return {
          conversion: () => ({
            node: $createNaddrNode({ naddr }),
          }),
          priority: 1,
        };
      },
    };
  }

  constructor(naddr: string, key?: NodeKey) {
    super(key);
    this.__naddr = naddr;
  }

  exportJSON(): SerializedNaddrNode {
    return {
      type: 'naddr',
      version: 1,
      naddr: this.__naddr,
    };
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.setAttribute('data-naddr', this.__naddr);
    span.textContent = getDisplayText(this.__naddr);
    return { element: span };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.naddr;
    if (className) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getNaddr(): string {
    return this.__naddr;
  }

  getTextContent(): string {
    return this.__naddr;
  }

  decorate(): ReactNode {
    return (
      <NaddrComponent
        naddr={this.__naddr}
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

export function $createNaddrNode({ naddr, key }: NaddrPayload): NaddrNode {
  return $applyNodeReplacement(new NaddrNode(naddr, key));
}

export function $isNaddrNode(node: LexicalNode | null | undefined): node is NaddrNode {
  return node instanceof NaddrNode;
}
