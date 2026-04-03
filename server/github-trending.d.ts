import type { TrendingPayload } from "./trending.js";

type TrendingFetch = (url: string, init?: {
  headers?: Record<string, string>;
}) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export function parseGitHubTrendingPage(
  html: string,
  period: string,
  limit?: number,
  capturedAt?: string
): TrendingPayload;

export function fetchGitHubTrendingResponse(
  period: string,
  language?: string,
  options?: {
    fetchImpl?: TrendingFetch;
    limit?: number;
    now?: Date;
  }
): Promise<TrendingPayload>;
