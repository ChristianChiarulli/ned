'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { NostrEditor, type NostrEditorHandle } from '@/components/editor';
import BlogSidebar from '@/components/sidebar/BlogSidebar';
import LoginButton from '@/components/auth/LoginButton';
import PublishDialog from '@/components/publish/PublishDialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/authStore';
import type { Blog } from '@/lib/nostr/types';


export default function Home() {
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const pubkey = useAuthStore((state) => state.pubkey);
  const editorRef = useRef<NostrEditorHandle>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSelectBlog = (blog: Blog) => {
    setSelectedBlog(blog);
  };

  const getEditorContent = useCallback(() => {
    return editorRef.current?.getMarkdown() ?? '';
  }, []);

  const handlePublishSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['blogs'] });
  }, [queryClient]);

  const handlePublishDialogClose = useCallback(() => {
    setShowPublishDialog(false);
  }, []);

  const isLoggedIn = isHydrated && !!pubkey;

  const editorContent = selectedBlog?.content ?? '';

  return (
    <div className="h-screen flex bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <BlogSidebar onSelectBlog={handleSelectBlog} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 flex items-center justify-end px-8 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            {isLoggedIn && selectedBlog && (
              <Button
                variant="outline"
                onClick={() => setSelectedBlog(null)}
              >
                New Article
              </Button>
            )}
            {isLoggedIn && (
              <Button
                variant={selectedBlog ? 'success' : 'default'}
                onClick={() => setShowPublishDialog(true)}
              >
                {selectedBlog ? 'Publish Edit' : 'Publish'}
              </Button>
            )}
            <LoginButton />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto cursor-text">
          <div className="min-h-full w-full max-w-3xl mx-auto flex flex-col">
            <NostrEditor
              ref={editorRef}
              key={selectedBlog?.id || 'default'}
              placeholder="What's on your mind?"
              initialMarkdown={editorContent}
            />
          </div>
        </div>
      </main>

      <PublishDialog
        isOpen={showPublishDialog}
        onClose={handlePublishDialogClose}
        getContent={getEditorContent}
        existingBlog={selectedBlog}
        onPublishSuccess={handlePublishSuccess}
      />
    </div>
  );
}
