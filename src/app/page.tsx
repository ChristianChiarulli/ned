'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { NostrEditor, type NostrEditorHandle } from '@/components/editor';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/sidebar/AppSidebar';
import BlogListPanel from '@/components/sidebar/BlogListPanel';
import DraftsPanel from '@/components/sidebar/DraftsPanel';
import SettingsPanel from '@/components/sidebar/SettingsPanel';
import LoginButton from '@/components/auth/LoginButton';
import PublishDialog from '@/components/publish/PublishDialog';
import { SaveStatusIndicator } from '@/components/SaveStatusIndicator';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/authStore';
import { useDraftStore } from '@/lib/stores/draftStore';
import { useDraftAutoSave } from '@/lib/hooks/useDraftAutoSave';
import { lookupProfile } from '@/lib/nostr/profiles';
import { lookupNote } from '@/lib/nostr/notes';
import { fetchBlogByAddress } from '@/lib/nostr/fetch';
import { blogToNaddr, decodeNaddr } from '@/lib/nostr/naddr';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import type { Blog } from '@/lib/nostr/types';


function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isLoadingBlog, setIsLoadingBlog] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const pubkey = useAuthStore((state) => state.pubkey);
  const relays = useSettingsStore((state) => state.relays);
  const editorRef = useRef<NostrEditorHandle>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarElement, setToolbarElement] = useState<HTMLDivElement | null>(null);

  // Connect toolbar ref to state once after mount
  useEffect(() => {
    setToolbarElement(toolbarRef.current);
  }, []);
  const queryClient = useQueryClient();

  // Get draft ID from URL or create new one
  const urlDraftId = searchParams.get('draft');
  const urlBlogId = searchParams.get('blog');
  const createDraft = useDraftStore((state) => state.createDraft);
  const createDraftFromBlog = useDraftStore((state) => state.createDraftFromBlog);
  const getDraft = useDraftStore((state) => state.getDraft);
  const deleteDraft = useDraftStore((state) => state.deleteDraft);
  const findDraftByLinkedBlog = useDraftStore((state) => state.findDraftByLinkedBlog);

  // Determine current draft ID
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  const { handleContentChange, draft } = useDraftAutoSave(currentDraftId);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Handle URL-based navigation
  useEffect(() => {
    if (!isHydrated) return;

    if (urlBlogId) {
      // Viewing a blog - check if we already have a draft for it
      const naddrData = decodeNaddr(urlBlogId);
      if (naddrData) {
        // Check if we already have a draft for this blog
        const existingDraft = findDraftByLinkedBlog(naddrData.pubkey, naddrData.identifier);
        if (existingDraft) {
          // Redirect to existing draft
          router.replace(`/?draft=${existingDraft.id}`);
          return;
        }

        // Check if we already have this blog loaded
        if (selectedBlog?.pubkey === naddrData.pubkey && selectedBlog?.dTag === naddrData.identifier) {
          return;
        }

        // Load blog without creating a draft
        setCurrentDraftId(null);
        setIsLoadingBlog(true);
        const relay = naddrData.relays[0] || relays[0];
        fetchBlogByAddress({
          pubkey: naddrData.pubkey,
          identifier: naddrData.identifier,
          relay,
        }).then((blog) => {
          setIsLoadingBlog(false);
          if (blog) {
            setSelectedBlog(blog);
          } else {
            // Blog not found, redirect to new draft
            const newId = createDraft();
            router.replace(`/?draft=${newId}`);
          }
        });
      } else {
        // Invalid naddr, redirect to new draft
        const newId = createDraft();
        router.replace(`/?draft=${newId}`);
      }
    } else if (urlDraftId) {
      // Viewing a draft
      setSelectedBlog(null);
      const existingDraft = getDraft(urlDraftId);
      if (existingDraft) {
        setCurrentDraftId(urlDraftId);
      } else {
        // Draft doesn't exist, create new and redirect
        const newId = createDraft();
        router.replace(`/?draft=${newId}`);
      }
    } else {
      // No draft or blog in URL - create new draft
      const newId = createDraft();
      router.replace(`/?draft=${newId}`);
    }
  }, [isHydrated, urlDraftId, urlBlogId, getDraft, createDraft, findDraftByLinkedBlog, router, relays, selectedBlog]);

  const handleSelectBlog = useCallback((blog: Blog) => {
    const naddr = blogToNaddr(blog, relays);
    router.push(`/?blog=${naddr}`);
  }, [router, relays]);

  const getEditorContent = useCallback(() => {
    return editorRef.current?.getMarkdown() ?? '';
  }, []);

  const [justPublished, setJustPublished] = useState(false);

  const handlePublishSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['blogs'] });
    setJustPublished(true);
  }, [queryClient]);

  const handlePublishDialogClose = useCallback(() => {
    setShowPublishDialog(false);

    // Clean up after successful publish when dialog closes
    if (justPublished) {
      setJustPublished(false);
      if (currentDraftId) {
        deleteDraft(currentDraftId);
      }
      setSelectedBlog(null);
      const newId = createDraft();
      router.replace(`/?draft=${newId}`);
    }
  }, [justPublished, currentDraftId, deleteDraft, createDraft, router]);

  const handleClosePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const handleNewArticle = useCallback(() => {
    const newId = createDraft();
    router.push(`/?draft=${newId}`);
  }, [createDraft, router]);

  const handleSelectDraft = useCallback((draftId: string) => {
    router.push(`/?draft=${draftId}`);
  }, [router]);

  const isLoggedIn = isHydrated && !!pubkey;

  // Determine if we're editing an existing blog (either via draft with linkedBlog or viewing a blog directly)
  const isEditing = !!draft?.linkedBlog || !!selectedBlog;

  // Determine editor content and key
  const editorContent = selectedBlog ? selectedBlog.content : (draft?.content ?? '');
  // Use consistent key format based on blog identity (pubkey:dTag) to prevent remount when transitioning from blog to draft
  const blogIdentityKey = selectedBlog ? `${selectedBlog.pubkey}:${selectedBlog.dTag}` : null;
  const linkedBlogKey = draft?.linkedBlog ? `${draft.linkedBlog.pubkey}:${draft.linkedBlog.dTag}` : null;
  const editorKey = blogIdentityKey || linkedBlogKey || currentDraftId || 'new';

  // Handle first edit on a blog - create draft and redirect
  const handleEditorChange = useCallback(() => {
    const markdown = editorRef.current?.getMarkdown() ?? '';

    if (selectedBlog) {
      // Only create draft if content actually changed from the original
      if (markdown !== selectedBlog.content) {
        const draftId = createDraftFromBlog(markdown, {
          pubkey: selectedBlog.pubkey,
          dTag: selectedBlog.dTag,
          title: selectedBlog.title,
          summary: selectedBlog.summary,
          image: selectedBlog.image,
          tags: selectedBlog.tags,
        });
        router.replace(`/?draft=${draftId}`);
      }
    } else if (currentDraftId) {
      // Normal draft editing
      handleContentChange(markdown);
    }
  }, [selectedBlog, currentDraftId, createDraftFromBlog, router, handleContentChange]);

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar activePanel={activePanel} onPanelChange={setActivePanel} onNewArticle={handleNewArticle} />

      {/* Collapsible panels */}
      {activePanel === 'blogs' && (
        <BlogListPanel onSelectBlog={handleSelectBlog} onClose={handleClosePanel} />
      )}
      {activePanel === 'drafts' && (
        <DraftsPanel onSelectDraft={handleSelectDraft} onClose={handleClosePanel} />
      )}
      {activePanel === 'settings' && (
        <SettingsPanel onClose={handleClosePanel} />
      )}

      <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
        <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 min-w-[100px]">
            <SaveStatusIndicator />
          </div>
          <div ref={toolbarRef} className="flex items-center justify-center" />
          <div className="flex items-center gap-2 justify-end min-w-[100px]">
            {isLoggedIn && (
              <Button
                size="sm"
                variant={isEditing ? 'success' : 'default'}
                onClick={() => setShowPublishDialog(true)}
              >
                {isEditing ? 'Publish Edit' : 'Publish'}
              </Button>
            )}
            <LoginButton />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto cursor-text">
          {isLoadingBlog ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
              Loading...
            </div>
          ) : (
          <div className="min-h-full w-full max-w-3xl mx-auto flex flex-col">
            <NostrEditor
              ref={editorRef}
              key={editorKey}
              placeholder="What's on your mind?"
              initialMarkdown={editorContent}
              onChange={handleEditorChange}
              onProfileLookup={lookupProfile}
              onNoteLookup={lookupNote}
              toolbarContainer={toolbarElement}
            />
          </div>
          )}
        </div>
      </SidebarInset>

      <PublishDialog
        isOpen={showPublishDialog}
        onClose={handlePublishDialogClose}
        getContent={getEditorContent}
        linkedBlog={draft?.linkedBlog || (selectedBlog ? {
          pubkey: selectedBlog.pubkey,
          dTag: selectedBlog.dTag,
          title: selectedBlog.title,
          summary: selectedBlog.summary,
          image: selectedBlog.image,
          tags: selectedBlog.tags,
        } : undefined)}
        onPublishSuccess={handlePublishSuccess}
      />
    </SidebarProvider>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
