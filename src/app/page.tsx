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
import GlobalFeedPanel from '@/components/sidebar/GlobalFeedPanel';
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
  const activeRelay = useSettingsStore((state) => state.activeRelay);
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

        // Try relays in order: naddr hint, active relay, then all configured relays
        const relaysToTry = [
          ...naddrData.relays,
          activeRelay,
          ...relays.filter(r => r !== activeRelay && !naddrData.relays.includes(r))
        ].filter(Boolean);

        // Try each relay until we find the blog
        const tryFetchFromRelays = async (relayList: string[]): Promise<Blog | null> => {
          for (const relay of relayList) {
            const blog = await fetchBlogByAddress({
              pubkey: naddrData.pubkey,
              identifier: naddrData.identifier,
              relay,
            });
            if (blog) return blog;
          }
          return null;
        };

        tryFetchFromRelays(relaysToTry).then((blog) => {
          setIsLoadingBlog(false);
          if (blog) {
            setSelectedBlog(blog);
          } else {
            // Blog not found on any relay, redirect to new draft
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

  // Determine if we're editing an existing blog (only when we have a draft with actual edits)
  const isEditing = !!draft?.linkedBlog;

  // Determine editor content and key
  const editorContent = selectedBlog ? selectedBlog.content : (draft?.content ?? '');
  // Use consistent key format based on blog identity (pubkey:dTag) to prevent remount when transitioning from blog to draft
  const blogIdentityKey = selectedBlog ? `${selectedBlog.pubkey}:${selectedBlog.dTag}` : null;
  const linkedBlogKey = draft?.linkedBlog ? `${draft.linkedBlog.pubkey}:${draft.linkedBlog.dTag}` : null;
  const editorKey = blogIdentityKey || linkedBlogKey || currentDraftId || 'new';

  // Normalize content for comparison - ignore insignificant differences
  const normalizeForComparison = (content: string) => {
    return content
      .replace(/\r\n/g, '\n')       // Normalize line endings
      .replace(/\u00A0/g, ' ')      // Non-breaking space to regular space
      .replace(/[ \t]+$/gm, '')     // Trim trailing whitespace from each line
      .replace(/^(>+)[ >]*$/gm, '$1') // Normalize empty blockquote lines ("> >" -> ">")
      .replace(/\n{3,}/g, '\n\n')   // Collapse 3+ newlines to 2
      .replace(/\n\n([-*])/g, '\n$1') // Normalize blank line before list to single newline
      .replace(/\\\\/g, '\\')       // Normalize double backslashes to single
      .replace(/\\_/g, '_')         // Unescape underscores (editor over-escapes)
      .replace(/\\\*/g, '*')        // Unescape asterisks
      .replace(/\\\./g, '.')        // Unescape periods
      .trim();                       // Remove leading/trailing whitespace
  };

  // Handle first edit on a blog - create draft and redirect
  const handleEditorChange = useCallback(() => {
    const markdown = editorRef.current?.getMarkdown() ?? '';

    if (selectedBlog) {
      // Only create draft if content actually changed from the original
      // Normalize both to ignore newline-only differences
      const normalizedOriginal = normalizeForComparison(selectedBlog.content);
      const normalizedEditor = normalizeForComparison(markdown);

      if (normalizedEditor !== normalizedOriginal) {
        // DEBUG: Keep these logs to diagnose unexpected draft creation - DO NOT REMOVE
        console.group('Draft created from blog view');
        console.log('Blog title:', selectedBlog.title);
        console.log('Original length:', selectedBlog.content.length, '| Normalized:', normalizedOriginal.length);
        console.log('Editor length:', markdown.length, '| Normalized:', normalizedEditor.length);
        console.log('--- Normalized original ---');
        console.log(JSON.stringify(normalizedOriginal));
        console.log('--- Normalized editor ---');
        console.log(JSON.stringify(normalizedEditor));
        // Find first difference
        for (let i = 0; i < Math.max(normalizedOriginal.length, normalizedEditor.length); i++) {
          if (normalizedOriginal[i] !== normalizedEditor[i]) {
            console.log(`First difference at index ${i}:`);
            console.log(`  Original char: ${JSON.stringify(normalizedOriginal[i])} (code: ${normalizedOriginal.charCodeAt(i)})`);
            console.log(`  Editor char: ${JSON.stringify(normalizedEditor[i])} (code: ${normalizedEditor.charCodeAt(i)})`);
            console.log(`  Context original: ${JSON.stringify(normalizedOriginal.slice(Math.max(0, i - 20), i + 20))}`);
            console.log(`  Context editor: ${JSON.stringify(normalizedEditor.slice(Math.max(0, i - 20), i + 20))}`);
            break;
          }
        }
        console.groupEnd();

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
    <SidebarProvider defaultOpen={true}>
      <AppSidebar activePanel={activePanel} onPanelChange={setActivePanel} onNewArticle={handleNewArticle} />

      {/* Collapsible panels - kept mounted to preserve scroll position */}
      <div className={activePanel === 'explore' ? '' : 'hidden'}>
        <GlobalFeedPanel onSelectBlog={handleSelectBlog} onClose={handleClosePanel} />
      </div>
      <div className={activePanel === 'blogs' ? '' : 'hidden'}>
        <BlogListPanel onSelectBlog={handleSelectBlog} onClose={handleClosePanel} />
      </div>
      <div className={activePanel === 'drafts' ? '' : 'hidden'}>
        <DraftsPanel onSelectDraft={handleSelectDraft} onClose={handleClosePanel} />
      </div>
      {activePanel === 'relays' && (
        <SettingsPanel onClose={handleClosePanel} />
      )}

      <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
        <header className="sticky top-0 z-10 flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2 min-w-[100px]">
            <SaveStatusIndicator />
          </div>
          <div ref={toolbarRef} className="flex items-center justify-center" />
          <div className="flex items-center gap-2 justify-end min-w-[100px]">
            {isLoggedIn && currentDraftId && (
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
