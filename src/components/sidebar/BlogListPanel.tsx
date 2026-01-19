'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { XIcon, MoreVerticalIcon } from 'lucide-react';
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

interface BlogListPanelProps {
  onSelectBlog?: (blog: Blog) => void;
  onClose: () => void;
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

export default function BlogListPanel({ onSelectBlog, onClose }: BlogListPanelProps) {
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
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    } catch (err) {
      console.error('Failed to delete blog:', err);
    } finally {
      setDeletingBlogId(null);
    }
  };

  return (
    <div className="w-72 h-screen border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Blogs
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

      {/* Blog List */}
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
                      <MoreVerticalIcon className="w-4 h-4" />
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
    </div>
  );
}
