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

export interface NeventPayload {
  nevent: string;
  key?: NodeKey;
}

export type SerializedNeventNode = Spread<
  {
    nevent: string;
  },
  SerializedLexicalNode
>;

function getDisplayText(nevent: string): string {
  if (nevent.length < 10) return nevent;
  return `nevent...${nevent.slice(-4)}`;
}

function NeventComponent({
  nevent,
  nodeKey,
}: {
  nevent: string;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nevent);
  const containerRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const displayText = getDisplayText(nevent);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditValue(nevent);
    setIsEditing(true);
  }, [nevent]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && /^nevent1[a-z0-9]+$/i.test(trimmed)) {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isNeventNode(node)) {
          const newNode = $createNeventNode({ nevent: trimmed });
          node.replace(newNode);
        }
      });
    }
    setIsEditing(false);
  }, [editor, nodeKey, editValue]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(nevent);
  }, [nevent]);

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
        title={nevent}
      >
        {displayText}
      </span>
      <button
        onClick={handleEditClick}
        className="inline-flex items-center justify-center w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
        title="Edit nevent"
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
                Nevent
              </label>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="nevent1..."
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

export class NeventNode extends DecoratorNode<ReactNode> {
  __nevent: string;

  static getType(): string {
    return 'nevent';
  }

  static clone(node: NeventNode): NeventNode {
    return new NeventNode(node.__nevent, node.__key);
  }

  static importJSON(serializedNode: SerializedNeventNode): NeventNode {
    const { nevent } = serializedNode;
    return $createNeventNode({ nevent });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        const nevent = domNode.getAttribute('data-nevent');
        if (!nevent) return null;
        return {
          conversion: () => ({
            node: $createNeventNode({ nevent }),
          }),
          priority: 1,
        };
      },
    };
  }

  constructor(nevent: string, key?: NodeKey) {
    super(key);
    this.__nevent = nevent;
  }

  exportJSON(): SerializedNeventNode {
    return {
      type: 'nevent',
      version: 1,
      nevent: this.__nevent,
    };
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.setAttribute('data-nevent', this.__nevent);
    span.textContent = getDisplayText(this.__nevent);
    return { element: span };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.nevent;
    if (className) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getNevent(): string {
    return this.__nevent;
  }

  getTextContent(): string {
    return this.__nevent;
  }

  decorate(): ReactNode {
    return (
      <NeventComponent
        nevent={this.__nevent}
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

export function $createNeventNode({ nevent, key }: NeventPayload): NeventNode {
  return $applyNodeReplacement(new NeventNode(nevent, key));
}

export function $isNeventNode(node: LexicalNode | null | undefined): node is NeventNode {
  return node instanceof NeventNode;
}
