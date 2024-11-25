import { useState, useEffect } from "react";
import type { Repository, FilterState } from "../types";

export const useGithubSearch = (filterState: FilterState) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || "";

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!GITHUB_TOKEN) {
        setError("GitHub token is missing");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let dateFilter = "";
        if (filterState.timeRange) {
          if (filterState.timeRange === "since_github") {
            dateFilter = `created:>2008-04-04`;
          } else {
            dateFilter = `${
              filterState.filterMode === "created" ? "created" : "pushed"
            }:>${
              new Date(Date.now() - parseInt(filterState.timeRange) * 86400000)
                .toISOString()
                .split("T")[0]
            }`;
          }
        }

        const queryParts = [
          filterState.searchQuery ? filterState.searchQuery : "",
          filterState.language ? `language:${filterState.language}` : "",
          dateFilter,
        ].filter(Boolean);

        const params = new URLSearchParams({
          q: queryParts.join(" ") || "stars:>1",
          sort: "stars",
          order: "desc",
          per_page: "30",
        });

        const response = await fetch(
          `https://api.github.com/search/repositories?${params}`,
          {
            headers: {
              Authorization: `Bearer ${GITHUB_TOKEN}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch repositories: ${response.statusText}`
          );
        }

        const data = await response.json();
        setRepositories(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, [filterState, GITHUB_TOKEN]);

  return { repositories, loading, error };
};
