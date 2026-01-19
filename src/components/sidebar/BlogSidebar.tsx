'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBlogs } from '@/lib/nostr/fetch';
import { deleteArticle } from '@/lib/nostr/publish';
import { useAuthStore } from '@/lib/stores/authStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Blog } from '@/lib/nostr/types';

interface BlogSidebarProps {
  onSelectBlog?: (blog: Blog) => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function truncateNpub(pubkey: string): string {
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;
}

function SettingsPanel({ onBack }: { onBack: () => void }) {
  const { relays, addRelay, removeRelay } = useSettingsStore();
  const [newRelay, setNewRelay] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleAddRelay = () => {
    const trimmed = newRelay.trim();
    if (trimmed && trimmed.startsWith('wss://')) {
      addRelay(trimmed);
      setNewRelay('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddRelay();
    }
  };

  if (!isHydrated) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-5 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          title="Back to blogs"
          aria-label="Back to blogs"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Settings
        </h2>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
              Relays
            </h3>
            <ul className="space-y-1">
              {relays.map((relay) => (
                <li
                  key={relay}
                  className="flex items-center justify-between gap-2 p-2 bg-zinc-200 dark:bg-zinc-800 rounded text-xs"
                >
                  <span className="text-zinc-700 dark:text-zinc-300 truncate flex-1">
                    {relay}
                  </span>
                  <button
                    onClick={() => removeRelay(relay)}
                    className="p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                    title="Remove relay"
                    aria-label="Remove relay"
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
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide block mb-2">
              Add Relay
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRelay}
                onChange={(e) => setNewRelay(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="wss://relay.example.com"
                className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                autoComplete="url"
              />
              <Button
                size="sm"
                onClick={handleAddRelay}
                disabled={!newRelay.trim() || !newRelay.startsWith('wss://')}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogSidebar({ onSelectBlog }: BlogSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [deletingBlogId, setDeletingBlogId] = useState<string | null>(null);
  const pubkey = useAuthStore((state) => state.pubkey);
  const relays = useSettingsStore((state) => state.relays);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['blogs', pubkey, relays[0]],
    queryFn: ({ pageParam }) => fetchBlogs({ limit: 10, until: pageParam, pubkey: pubkey ?? undefined, relay: relays[0] }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isHydrated && !!pubkey && relays.length > 0,
  });

  const blogs = data?.pages.flatMap((page) => page.blogs) ?? [];
  const isLoggedIn = isHydrated && !!pubkey;

  const handleDelete = async (blog: Blog, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingBlogId) return;

    setDeletingBlogId(blog.id);
    try {
      await deleteArticle({ eventId: blog.id, relays });
      // Invalidate the blogs query to refetch
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    } catch (err) {
      console.error('Failed to delete blog:', err);
    } finally {
      setDeletingBlogId(null);
    }
  };

  return (
    <aside
      className={`flex-shrink-0 h-screen sticky top-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-72'
      }`}
    >
      {showSettings && !isCollapsed ? (
        <SettingsPanel onBack={() => setShowSettings(false)} />
      ) : (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-5 border-b border-zinc-200 dark:border-zinc-800">
            {!isCollapsed && (
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Blogs
              </h2>
            )}
            <div className="flex items-center gap-1">
              {!isCollapsed && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  title="Settings"
                  aria-label="Settings"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Blog List */}
          {!isCollapsed && (
            <div className="flex-1 overflow-y-auto">
              {!isLoggedIn && (
                <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                  <p>Sign in to see your blogs here.</p>
                </div>
              )}

              {isLoggedIn && isLoading && (
                <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                  Loading blogs...
                </div>
              )}

              {isLoggedIn && isError && (
                <div className="p-4 text-center text-red-500 text-sm">
                  Failed to load blogs
                </div>
              )}

              {isLoggedIn && !isLoading && blogs.length === 0 && (
                <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                  No blogs found
                </div>
              )}

              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {blogs.map((blog) => (
                  <li key={blog.id} className="relative group">
                    <button
                      onClick={() => onSelectBlog?.(blog)}
                      className="w-full text-left p-3 pr-10 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {blog.title}
                      </h3>
                      {blog.summary && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                          {blog.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                        <span>{truncateNpub(blog.pubkey)}</span>
                        <span>&middot;</span>
                        <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
                      </div>
                    </button>
                    <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                            aria-label="More options"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => handleDelete(blog, e)}
                            disabled={deletingBlogId === blog.id}
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                          >
                            {deletingBlogId === blog.id ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Load More Button */}
              {isLoggedIn && hasNextPage && (
                <div className="p-3">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Collapsed state icon */}
          {isCollapsed && (
            <div className="flex-1 flex items-start justify-center pt-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-400"
                aria-hidden="true"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
