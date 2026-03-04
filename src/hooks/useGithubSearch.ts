import { useState, useEffect, useRef } from "react";
import type { Repository, FilterState } from "../types";

const requestCache = new Map<string, any>();

export const useGithubSearch = (filterState: FilterState) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMorePending = useRef(false);
  const currentFilter = useRef(filterState);

  useEffect(() => {
    let active = true;

    const fetchRepositories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if filter changed since last time, if so reset page implicitly for this request
        const isNewSearch = currentFilter.current !== filterState;
        const currentPage = isNewSearch ? 1 : page;
        if (isNewSearch) {
          currentFilter.current = filterState;
          setPage(1);
        }

        let dateFilter = "";
        if (filterState.timeRange) {
          if (filterState.timeRange === "since_github") {
            dateFilter = `created:>2008-04-04`;
          } else {
            dateFilter = `${filterState.filterMode === "created" ? "created" : "pushed"
              }:>${new Date(Date.now() - parseInt(filterState.timeRange) * 86400000)
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
          per_page: "12",
          page: currentPage.toString(),
        });

        const cacheKey = params.toString();
        let data;

        if (requestCache.has(cacheKey)) {
          // Use cached data to save requests
          data = requestCache.get(cacheKey);
        } else {
          const response = await fetch(`/api/search/repositories?${params}`);

          if (!response.ok) {
            throw new Error(`Failed to fetch repositories: ${response.statusText}`);
          }

          data = await response.json();
          // Cache successful responses to save future requests
          requestCache.set(cacheKey, data);
        }

        if (!active) return;

        const items = data.items || [];
        setRepositories((prev) => (currentPage === 1 ? items : [...prev, ...items]));
        setHasMore(items.length > 0);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (active) {
          setLoading(false);
          loadMorePending.current = false;
        }
      }
    };

    if (hasMore || currentFilter.current !== filterState) {
      if (currentFilter.current !== filterState) {
        setRepositories([]); // Clear instantly before fetch
      }
      fetchRepositories();
    }

    return () => {
      active = false;
    };
  }, [filterState, page]);

  useEffect(() => {
    loadMorePending.current = false;
  }, [repositories, error]);

  const loadMore = () => {
    if (!loading && hasMore && !loadMorePending.current) {
      loadMorePending.current = true;
      setPage((prev) => prev + 1);
    }
  };

  return { repositories, loading, error, loadMore, hasMore };
};
