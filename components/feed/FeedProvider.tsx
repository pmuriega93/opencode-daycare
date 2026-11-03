"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Toast } from "@/components/ui/Toast";
import { posts as mockPosts } from "@/lib/mocks/feed";
import type { Post } from "@/lib/types/feed";

type FeedContextValue = {
  posts: Post[];
  addPost: (post: Post) => void;
  isComposerOpen: boolean;
  openComposer: () => void;
  closeComposer: () => void;
  toast: string | null;
  notify: (message: string) => void;
};

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: { children: ReactNode }) {
  // Publicaciones en memoria: se pierden al recargar (por diseño, SPEC 06).
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const addPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  const openComposer = useCallback(() => setComposerOpen(true), []);
  const closeComposer = useCallback(() => setComposerOpen(false), []);
  const notify = useCallback((message: string) => setToast(message), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const value = useMemo(
    () => ({
      posts,
      addPost,
      isComposerOpen,
      openComposer,
      closeComposer,
      toast,
      notify,
    }),
    [
      posts,
      addPost,
      isComposerOpen,
      openComposer,
      closeComposer,
      toast,
      notify,
    ],
  );

  return (
    <FeedContext.Provider value={value}>
      {children}
      {toast ? <Toast message={toast} onDismiss={dismissToast} /> : null}
    </FeedContext.Provider>
  );
}

export function useFeed(): FeedContextValue {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error("useFeed debe usarse dentro de FeedProvider");
  }
  return context;
}
