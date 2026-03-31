import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FilterState, Repository } from "../types";

const PER_PAGE = 12;
const DEFAULT_DISCOVERY_MIN_STARS = 10;
const SEARCH_QUERY_MIN_STARS = 1;

type SearchResponse = {
  items?: Repository[];
  total_count?: number;
};

const requestCache = new Map<string, SearchResponse>();

function getMinimumStars(filterState: FilterState) {
  return filterState.searchQuery.trim() ? SEARCH_QUERY_MIN_STARS : DEFAULT_DISCOVERY_MIN_STARS;
}

export const useGithubSearch = (filterState: FilterState) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const loadMorePending = useRef(false);
  const filterKey = useMemo(() => JSON.stringify(filterState), [filterState]);
  const previousFilterKey = useRef(filterKey);

  useEffect(() => {
    const isNewFilter = previousFilterKey.current !== filterKey;

    if (isNewFilter) {
      previousFilterKey.current = filterKey;
      loadMorePending.current = false;
      setRepositories([]);
      setHasMore(true);
      setTotalCount(0);
      setError(null);

      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    let active = true;

    const fetchRepositories = async () => {
      try {
        setLoading(true);
        setError(null);

        let dateFilter = "";
        if (filterState.timeRange) {
          if (filterState.timeRange === "since_github") {
            dateFilter = "created:>2008-04-04";
          } else {
            const days = Number.parseInt(filterState.timeRange, 10);
            const boundaryDate = new Date(Date.now() - days * 86400000)
              .toISOString()
              .split("T")[0];

            dateFilter = `${
              filterState.filterMode === "created" ? "created" : "pushed"
            }:>${boundaryDate}`;
          }
        }

        const minimumStars = getMinimumStars(filterState);
        const queryParts = [
          filterState.searchQuery.trim(),
          filterState.language ? `language:${filterState.language}` : "",
          dateFilter,
          `stars:>=${minimumStars}`,
          "archived:false",
          "mirror:false",
        ].filter(Boolean);
        const sort = filterState.filterMode === "updated" ? "updated" : "stars";

        const params = new URLSearchParams({
          q: queryParts.join(" "),
          sort,
          order: "desc",
          per_page: PER_PAGE.toString(),
          page: (isNewFilter ? 1 : page).toString(),
        });

        const cacheKey = params.toString();
        let data: SearchResponse;

        if (requestCache.has(cacheKey)) {
          data = requestCache.get(cacheKey) as SearchResponse;
        } else {
          const response = await fetch(`/api/search/repositories?${params}`);

          if (!response.ok) {
            throw new Error(`Failed to fetch repositories: ${response.statusText}`);
          }

          data = await response.json();
          requestCache.set(cacheKey, data);
        }

        if (!active) {
          return;
        }

        const items = data.items || [];
        const nextTotalCount = data.total_count ?? 0;
        const nextPage = isNewFilter ? 1 : page;

        setTotalCount(nextTotalCount);
        setRepositories((prev) => (nextPage === 1 ? items : [...prev, ...items]));
        setHasMore(nextPage * PER_PAGE < nextTotalCount && items.length === PER_PAGE);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "An error occurred");
          setHasMore(false);
        }
      } finally {
        if (active) {
          setLoading(false);
          loadMorePending.current = false;
        }
      }
    };

    void fetchRepositories();

    return () => {
      active = false;
    };
  }, [filterKey, filterState, page]);

  useEffect(() => {
    loadMorePending.current = false;
  }, [repositories, error]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && !loadMorePending.current) {
      loadMorePending.current = true;
      setPage((prev) => prev + 1);
    }
  }, [hasMore, loading]);

  return { repositories, loading, error, loadMore, hasMore, totalCount };
};
