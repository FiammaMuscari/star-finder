import { PERIOD_DAYS, normalizeLanguage, normalizePeriod } from "./trending.js";

const CACHE_TTL_MS = 15 * 60 * 1000;
const PERIOD_TO_SINCE = {
  today: "daily",
  week: "weekly",
  month: "monthly",
};
const responseCache = new Map();

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parseCount(value) {
  if (!value) {
    return 0;
  }

  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number.parseInt(digits, 10) : 0;
}

function buildGitHubTrendingUrl(period, language = "") {
  const normalizedPeriod = normalizePeriod(period);
  const normalizedLanguage = normalizeLanguage(language);
  const languagePath = normalizedLanguage
    ? `/${encodeURIComponent(normalizedLanguage.toLowerCase())}`
    : "";

  return `https://github.com/trending${languagePath}?since=${PERIOD_TO_SINCE[normalizedPeriod]}`;
}

function parseTrendingArticle(article, capturedAt) {
  const repoMatch = article.match(/<h2[^>]*>[\s\S]*?<a[^>]*href="\/([^"#?]+)"/i);
  const repoFullName = decodeHtmlEntities((repoMatch?.[1] || "").replace(/\s+/g, ""));

  if (!repoFullName || !repoFullName.includes("/")) {
    return null;
  }

  const starsMatch = article.match(
    /href="\/[^"#?]+\/stargazers"[\s\S]*?<\/svg>\s*([\d,]+)/i
  );
  const languageMatch = article.match(/itemprop="programmingLanguage">([\s\S]*?)</i);
  const growthMatch = article.match(/([\d,]+)\s+stars\s+(today|this week|this month)/i);
  const descriptionMatch = article.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

  return {
    repo_full_name: repoFullName,
    stars: parseCount(starsMatch?.[1] || "0"),
    growth: growthMatch ? parseCount(growthMatch[1]) : null,
    language: languageMatch ? stripHtml(languageMatch[1]) : null,
    description: descriptionMatch ? stripHtml(descriptionMatch[1]) : null,
    captured_at: capturedAt,
  };
}

export function parseGitHubTrendingPage(html, period, limit = 10, capturedAt = new Date().toISOString()) {
  const normalizedPeriod = normalizePeriod(period);
  const articles = Array.from(html.matchAll(/<article\b[\s\S]*?<\/article>/gi));
  const items = articles
    .map((match) => parseTrendingArticle(match[0], capturedAt))
    .filter(Boolean)
    .slice(0, limit);

  return {
    period: normalizedPeriod,
    days: PERIOD_DAYS[normalizedPeriod],
    ready: items.length > 0,
    message: null,
    periodAvailability: {
      today: true,
      week: true,
      month: true,
    },
    items,
  };
}

export async function fetchGitHubTrendingResponse(
  period,
  language = "",
  { fetchImpl = fetch, limit = 10, now = new Date() } = {}
) {
  const normalizedPeriod = normalizePeriod(period);
  const normalizedLanguage = normalizeLanguage(language);
  const cacheKey = `${normalizedPeriod}:${normalizedLanguage || "__all__"}:${limit}`;
  const cached = responseCache.get(cacheKey);

  if (cached && now.getTime() - cached.createdAt < CACHE_TTL_MS) {
    return cached.payload;
  }

  const response = await fetchImpl(buildGitHubTrendingUrl(normalizedPeriod, normalizedLanguage), {
    headers: {
      Accept: "text/html",
      "User-Agent": "star-finder",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub Trending request failed with status ${response.status}.`);
  }

  const html = await response.text();
  const payload = parseGitHubTrendingPage(html, normalizedPeriod, limit, now.toISOString());

  responseCache.set(cacheKey, {
    createdAt: now.getTime(),
    payload,
  });

  return payload;
}
