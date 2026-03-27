import { readSnapshotStore } from "../server/trending-snapshots.js";
import {
  buildTrendingResponse,
  normalizeLanguage,
  normalizePeriod,
} from "../server/trending.js";

export default async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const period = normalizePeriod(url.searchParams.get("period") || "today");
  const language = normalizeLanguage(url.searchParams.get("language") || "");

  try {
    const snapshotStore = await readSnapshotStore();
    const payload = buildTrendingResponse(snapshotStore, period, 10, language);

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({
      period,
      days: 0,
      ready: false,
      message: "trendingUnavailable",
      periodAvailability: {
        today: false,
        week: false,
        month: false,
      },
      items: [],
    });
  }
}
