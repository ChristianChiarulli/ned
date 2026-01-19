'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { NostrEditor, type NostrEditorHandle } from '@/components/editor';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/sidebar/AppSidebar';
import BlogListPanel from '@/components/sidebar/BlogListPanel';
import SettingsPanel from '@/components/sidebar/SettingsPanel';
import LoginButton from '@/components/auth/LoginButton';
import PublishDialog from '@/components/publish/PublishDialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/authStore';
import { lookupProfile } from '@/lib/nostr/profiles';
import { lookupNote } from '@/lib/nostr/notes';
import type { Blog } from '@/lib/nostr/types';


export default function Home() {
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
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

  const handleClosePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const handleNewArticle = useCallback(() => {
    setSelectedBlog(null);
  }, []);

  const isLoggedIn = isHydrated && !!pubkey;

  const editorContent = selectedBlog?.content ?? '';

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar activePanel={activePanel} onPanelChange={setActivePanel} onNewArticle={handleNewArticle} />

      {/* Collapsible panels */}
      {activePanel === 'blogs' && (
        <BlogListPanel onSelectBlog={handleSelectBlog} onClose={handleClosePanel} />
      )}
      {activePanel === 'settings' && (
        <SettingsPanel onClose={handleClosePanel} />
      )}

      <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
        <header className="flex-shrink-0 flex items-center justify-end px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <Button
                size="sm"
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
              onProfileLookup={lookupProfile}
              onNoteLookup={lookupNote}
            />
          </div>
        </div>
      </SidebarInset>

      <PublishDialog
        isOpen={showPublishDialog}
        onClose={handlePublishDialogClose}
        getContent={getEditorContent}
        existingBlog={selectedBlog}
        onPublishSuccess={handlePublishSuccess}
      />
    </SidebarProvider>
  );
}
