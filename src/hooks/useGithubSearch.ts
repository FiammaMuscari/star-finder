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
const inFlightRequests = new Map<string, Promise<SearchResponse>>();

function getMinimumStars(filterState: FilterState) {
  return filterState.searchQuery.trim() ? SEARCH_QUERY_MIN_STARS : DEFAULT_DISCOVERY_MIN_STARS;
}

function getDateFilter(filterState: FilterState) {
  if (!filterState.timeRange) {
    return "";
  }

  if (filterState.timeRange === "since_github") {
    return "created:>2008-04-04";
  }

  const days = Number.parseInt(filterState.timeRange, 10);
  const boundaryDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

  return `${filterState.filterMode === "created" ? "created" : "pushed"}:>${boundaryDate}`;
}

function buildSearchParams(filterState: FilterState, page: number) {
  const minimumStars = getMinimumStars(filterState);
  const queryParts = [
    filterState.searchQuery.trim(),
    filterState.language ? `language:${filterState.language}` : "",
    getDateFilter(filterState),
    `stars:>=${minimumStars}`,
    "archived:false",
    "mirror:false",
  ].filter(Boolean);
  const sort = filterState.filterMode === "updated" ? "updated" : "stars";

  return new URLSearchParams({
    q: queryParts.join(" "),
    sort,
    order: "desc",
    per_page: PER_PAGE.toString(),
    page: page.toString(),
  });
}

async function fetchSearchResponse(params: URLSearchParams) {
  const cacheKey = params.toString();

  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey) as SearchResponse;
  }

  const existingRequest = inFlightRequests.get(cacheKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = fetch(`/api/search/repositories?${params}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.statusText}`);
      }

      const data = (await response.json()) as SearchResponse;
      requestCache.set(cacheKey, data);
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, request);

  return request;
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
        const nextPage = isNewFilter ? 1 : page;
        const params = buildSearchParams(filterState, nextPage);
        const data = await fetchSearchResponse(params);

        if (!active) {
          return;
        }

        const items = data.items || [];
        const nextTotalCount = data.total_count ?? 0;

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

  const prefetchSearch = useCallback((nextFilterState: FilterState) => {
    void fetchSearchResponse(buildSearchParams(nextFilterState, 1)).catch(() => {
      // Ignore prefetch errors and fall back to the normal click path.
    });
  }, []);

  return { repositories, loading, error, loadMore, hasMore, totalCount, prefetchSearch };
};
