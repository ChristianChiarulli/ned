'use client';

import { useState, useEffect } from 'react';
import { XIcon, FileEditIcon, Trash2Icon } from 'lucide-react';
import { useDraftStore } from '@/lib/stores/draftStore';

interface DraftsPanelProps {
  onSelectDraft?: () => void;
  onClose: () => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function extractPreview(content: string): { title: string; preview: string } {
  const lines = content.split('\n').filter((line) => line.trim());

  // Try to extract title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Draft';

  // Get preview from non-heading content
  const previewLines = lines
    .filter((line) => !line.startsWith('#'))
    .slice(0, 2)
    .join(' ')
    .slice(0, 100);

  return { title, preview: previewLines || 'No content' };
}

export default function DraftsPanel({ onSelectDraft, onClose }: DraftsPanelProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const { content, lastSaved, clearDraft } = useDraftStore();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const hasDraft = isHydrated && content.trim().length > 0;
  const { title, preview } = hasDraft ? extractPreview(content) : { title: '', preview: '' };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this draft?')) {
      clearDraft();
    }
  };

  return (
    <div className="w-72 h-screen border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Drafts
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          title="Close panel"
          aria-label="Close panel"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Drafts List */}
      <div className="flex-1 overflow-y-auto">
        {!isHydrated && (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            Loading...
          </div>
        )}

        {isHydrated && !hasDraft && (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            <FileEditIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No drafts</p>
            <p className="text-xs mt-1">Start writing and your work will be auto-saved here.</p>
          </div>
        )}

        {hasDraft && (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            <li className="relative group">
              <button
                onClick={() => onSelectDraft?.()}
                className="w-full text-left p-3 pr-10 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {title}
                </h3>
                {preview && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    {preview}
                  </p>
                )}
                {lastSaved && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                    <span>Last saved {formatDate(lastSaved)}</span>
                  </div>
                )}
              </button>
              <button
                onClick={handleDelete}
                className="absolute right-2 top-3 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-red-500 transition-all"
                aria-label="Delete draft"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
