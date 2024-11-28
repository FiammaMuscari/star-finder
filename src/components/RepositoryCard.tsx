import React from "react";
import type { Repository } from "../types";

export const RepositoryCard: React.FC<{ repo: Repository }> = ({ repo }) => {
  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg border hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        {/* Avatar and Info */}
        <div className="flex items-start gap-4">
          <img
            src={repo.owner.avatar_url}
            alt="avatar"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border"
          />
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-semibold">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {repo.name}
              </a>
            </h3>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base line-clamp-2">
              {repo.description}
            </p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex sm:justify-end items-center gap-2 text-sm sm:text-base">
          <span className="whitespace-nowrap flex items-center gap-1 text-black">
            ⭐️ {repo.stargazers_count.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
        {repo.language && <span>{repo.language}</span>}
        <span>Created: {new Date(repo.created_at).toLocaleDateString()}</span>
        <span>Updated: {new Date(repo.pushed_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
