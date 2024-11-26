import React from "react";
import { RepositoryCard } from "./RepositoryCard";
import type { RepositoryListProps } from "../types";

export const RepositoryList: React.FC<RepositoryListProps> = ({
  repositories,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col  justify-center items-center min-h-[200px] z-20">
        <img src="/octo-loading.gif" alt="octocat-runing" className="w-20" />
        <div className="animate-spin rounded-full ml-4 mt-2 h-8 w-8 border-4 border-gray-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 max-w-3xl m-auto z-20">
      {repositories.map((repo) => (
        <RepositoryCard key={repo.id} repo={repo} />
      ))}
    </div>
  );
};
