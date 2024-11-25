import React from "react";
import type { Repository } from "../types";

export const RepositoryCard: React.FC<{ repo: Repository }> = ({ repo }) => {
  return (
    <div className="p-6 bg-white rounded-lg border hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {repo.name}
            </a>
          </h3>
          <p className="text-gray-600 mt-2">{repo.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-black">
            ⭐️ {repo.stargazers_count.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="mt-4 flex gap-4 text-sm text-gray-500">
        <span>{repo.language}</span>
        <span>Created: {new Date(repo.created_at).toLocaleDateString()}</span>
        <span>Updated: {new Date(repo.pushed_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
