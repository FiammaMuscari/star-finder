import { fetchGitHubTrendingResponse } from "./github-trending.js";
import { readSnapshotStore } from "./trending-snapshots.js";
import {
  buildTrendingResponse,
  normalizeLanguage,
  normalizePeriod,
} from "./trending.js";

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
      return await fetchGitHubTrendingResponse(normalizedPeriod, normalizedLanguage, {
        fetchImpl,
        limit,
      });
    } catch {
      // Fall back to the local snapshot store if GitHub changes or throttles requests.
    }
  }

  const snapshotStore = await readSnapshotStore();
  return buildTrendingResponse(snapshotStore, normalizedPeriod, limit, normalizedLanguage);
}
