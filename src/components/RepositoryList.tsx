import React, { useMemo, memo, useCallback, useRef } from "react";
import { RepositoryCard } from "./RepositoryCard";
import type { RepositoryListProps } from "../types";

export const RepositoryList: React.FC<RepositoryListProps> = memo(
  ({ repositories, loading, loadMore, hasMore }) => {
    const observer = useRef<IntersectionObserver | null>(null);
    const observerTarget = useCallback(
      (node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMore();
          }
        });

        if (node) observer.current.observe(node);
      },
      [loading, hasMore, loadMore]
    );

    const loadingContent = useMemo(
      () => (
        <div className="flex flex-col justify-center items-center min-h-[200px] z-20 py-4 w-full">
          <img src="/octo-loading.gif" alt="octocat-runing" className="w-20" />
          <div className="animate-spin rounded-full ml-4 mt-2 h-8 w-8 border-4 border-gray-500 border-t-transparent" />
        </div>
      ),
      []
    );

    const repositoryGrid = useMemo(
      () => (
        <div className="grid gap-4 max-w-3xl m-auto z-20 w-full mb-10 pb-10">
          {repositories.map((repo, index) => (
            <div key={`${repo.id}-${index}`}>
              <RepositoryCard repo={repo} />
            </div>
          ))}
        </div>
      ),
      [repositories]
    );

    if (loading && repositories.length === 0) {
      return loadingContent;
    }

    return (
      <div className="flex flex-col w-full h-full">
        {repositoryGrid}
        {loading && repositories.length > 0 && loadingContent}
        <div ref={observerTarget} className="h-10 w-full"></div>
      </div>
    );
  }
);

RepositoryList.displayName = "RepositoryList";
