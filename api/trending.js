import {
  buildUnavailableTrendingPayload,
  getTrendingPayload,
} from "../server/trending-service.js";
import { normalizeLanguage, normalizePeriod } from "../server/trending.js";

export default async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const period = normalizePeriod(url.searchParams.get("period") || "today");
  const language = normalizeLanguage(url.searchParams.get("language") || "");

  try {
    const payload = await getTrendingPayload(period, language);

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(payload);
  } catch {
    return res.status(500).json(buildUnavailableTrendingPayload(period));
  }
}
