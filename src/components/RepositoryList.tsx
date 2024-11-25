import React from 'react';
import { RepositoryCard } from './RepositoryCard';
import type { RepositoryListProps } from '../types';

export const RepositoryList: React.FC<RepositoryListProps> = ({ repositories, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {repositories.map((repo) => (
        <RepositoryCard key={repo.id} repo={repo} />
      ))}
    </div>
  );
};