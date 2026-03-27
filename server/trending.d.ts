import type { RepoStarSnapshot, SnapshotStore } from "./trending-snapshots.js";

export type TrendingPeriod = "today" | "week" | "month";

export type TrendingResult = {
  repo_full_name: string;
  stars: number;
  growth: number;
  captured_at: string;
};

export type TrendingComparison = {
  repo_full_name: string;
  available: boolean;
  growth: number | null;
  latest: {
    stars: number;
    captured_at: string;
  };
  baseline: {
    stars: number;
    captured_at: string;
  } | null;
  required_captured_at: string;
};

export type TrendingPayload = {
  period: TrendingPeriod;
  days: number;
  ready: boolean;
  message: string | null;
  items: TrendingResult[];
};

export const PERIOD_DAYS: Record<TrendingPeriod, number>;

export function normalizePeriod(period: string): TrendingPeriod;

export function normalizeCapturedAt(date: string): string;

export function mergeSnapshots(
  existingSnapshots: RepoStarSnapshot[],
  incomingSnapshots: RepoStarSnapshot[]
): RepoStarSnapshot[];

export function pruneSnapshots(
  snapshots: RepoStarSnapshot[],
  daysToKeep?: number
): RepoStarSnapshot[];

export function getTrackedRepoNames(
  snapshots: RepoStarSnapshot[],
  daysBack?: number
): string[];

export function buildTrendingComparisons(
  snapshotStore: SnapshotStore,
  period: string
): {
  period: TrendingPeriod;
  days: number;
  comparisons: TrendingComparison[];
};

export function buildTrendingResponse(
  snapshotStore: SnapshotStore,
  period: string,
  limit?: number
): TrendingPayload;
