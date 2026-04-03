import { fetchGitHubTrendingResponse } from "./github-trending.js";
import { readSnapshotStore } from "./trending-snapshots.js";
import {
  buildTrendingResponse,
  normalizeLanguage,
  normalizePeriod,
} from "./trending.js";

function normalizeRepoFullName(repoFullName) {
  return typeof repoFullName === "string" ? repoFullName.trim().toLowerCase() : "";
}

function mergeTrendingItems(primaryItems, supplementalItems, limit) {
  const mergedItems = [];
  const seenRepoNames = new Set();

  for (const item of [...primaryItems, ...supplementalItems]) {
    const repoKey = normalizeRepoFullName(item.repo_full_name);

    if (!repoKey || seenRepoNames.has(repoKey)) {
      continue;
    }

    seenRepoNames.add(repoKey);
    mergedItems.push(item);

    if (mergedItems.length >= limit) {
      break;
    }
  }

  return mergedItems;
}

export function buildUnavailableTrendingPayload(period) {
  const normalizedPeriod = normalizePeriod(period);

  return {
    period: normalizedPeriod,
    days: 0,
    ready: false,
    message: "trendingUnavailable",
    periodAvailability: {
      today: false,
      week: false,
      month: false,
    },
    items: [],
  };
}

export async function getTrendingPayload(
  period,
  language = "",
  { fetchImpl = fetch, limit = 10 } = {}
) {
  const normalizedPeriod = normalizePeriod(period);
  const normalizedLanguage = normalizeLanguage(language);

  if (process.env.TRENDING_SOURCE !== "snapshots") {
    try {
      const githubPayload = await fetchGitHubTrendingResponse(normalizedPeriod, normalizedLanguage, {
        fetchImpl,
        limit,
      });

      if (githubPayload.items.length >= limit) {
        return githubPayload;
      }

      const snapshotStore = await readSnapshotStore();
      const snapshotPayload = buildTrendingResponse(
        snapshotStore,
        normalizedPeriod,
        limit,
        normalizedLanguage
      );

      return {
        ...githubPayload,
        ready: githubPayload.ready || snapshotPayload.ready,
        message: githubPayload.ready ? githubPayload.message : snapshotPayload.message,
        periodAvailability: githubPayload.ready
          ? githubPayload.periodAvailability
          : snapshotPayload.periodAvailability,
        items: mergeTrendingItems(githubPayload.items, snapshotPayload.items, limit),
      };
    } catch {
      // Fall back to the local snapshot store if GitHub changes or throttles requests.
    }
  }

  const snapshotStore = await readSnapshotStore();
  return buildTrendingResponse(snapshotStore, normalizedPeriod, limit, normalizedLanguage);
}
