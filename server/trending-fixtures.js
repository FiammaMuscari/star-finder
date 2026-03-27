import { normalizeCapturedAt } from "./trending.js";

export const FIXTURE_END_DATE = "2026-03-26T00:00:00.000Z";

function addDays(dateString, offsetDays) {
  const nextDate = new Date(dateString);
  nextDate.setUTCDate(nextDate.getUTCDate() + offsetDays);
  return normalizeCapturedAt(nextDate.toISOString());
}

function buildCumulativeSeries(initialStars, increments) {
  const stars = [initialStars];

  increments.forEach((increment) => {
    stars.push(stars[stars.length - 1] + increment);
  });

  return stars;
}

function buildDailySnapshots(repoFullName, startDate, starCounts, language = null) {
  return starCounts.map((stars, index) => ({
    repo_full_name: repoFullName,
    stars,
    language,
    captured_at: addDays(startDate, index),
  }));
}

export function createSingleSnapshotStore(endDate = FIXTURE_END_DATE) {
  return {
    snapshots: [
      {
        repo_full_name: "octo/rocket-db",
        stars: 181,
        language: "TypeScript",
        captured_at: normalizeCapturedAt(endDate),
      },
      {
        repo_full_name: "acme/ui-kit",
        stars: 261,
        language: "TypeScript",
        captured_at: normalizeCapturedAt(endDate),
      },
    ],
  };
}

export function createSeedSnapshotStore(endDate = FIXTURE_END_DATE) {
  const monthStartDate = addDays(endDate, -30);
  const shortHistoryStartDate = addDays(endDate, -7);

  const rocketDbSeries = buildCumulativeSeries(50, [
    ...Array.from({ length: 29 }, () => 4),
    15,
  ]);
  const uiKitSeries = buildCumulativeSeries(200, [
    ...Array.from({ length: 29 }, () => 2),
    3,
  ]);
  const newWaveSeries = buildCumulativeSeries(10, [6, 7, 8, 9, 10, 11, 12]);

  const snapshots = [
    ...buildDailySnapshots("octo/rocket-db", monthStartDate, rocketDbSeries, "TypeScript"),
    ...buildDailySnapshots("acme/ui-kit", monthStartDate, uiKitSeries, "TypeScript"),
    ...buildDailySnapshots("labs/new-wave", shortHistoryStartDate, newWaveSeries, "Python"),
    {
      repo_full_name: "solo/fresh-start",
      stars: 30,
      language: "Go",
      captured_at: normalizeCapturedAt(endDate),
    },
  ];

  return {
    snapshots: snapshots.sort((left, right) => {
      if (left.repo_full_name === right.repo_full_name) {
        return left.captured_at.localeCompare(right.captured_at);
      }

      return left.repo_full_name.localeCompare(right.repo_full_name);
    }),
  };
}

export function createEdgeCaseSnapshotStore(endDate = FIXTURE_END_DATE) {
  const monthStartDate = addDays(endDate, -30);
  const highStarsLowGrowth = buildCumulativeSeries(100000, [
    ...Array.from({ length: 29 }, () => 1),
    2,
  ]);
  const lowStarsHighGrowth = buildCumulativeSeries(200, [
    ...Array.from({ length: 23 }, () => 3),
    40,
    45,
    50,
    55,
    60,
    70,
    80,
  ]);
  const flatGrowth = buildCumulativeSeries(5000, Array.from({ length: 30 }, () => 0));
  const negativeGrowth = [
    ...Array.from({ length: 30 }, (_, index) => 4000 - index * 10),
    3600,
  ];

  const snapshots = [
    ...buildDailySnapshots("mega/legacy-platform", monthStartDate, highStarsLowGrowth, "Java"),
    ...buildDailySnapshots("indie/rocket-launch", monthStartDate, lowStarsHighGrowth, "Rust"),
    ...buildDailySnapshots("stable/quiet-engine", monthStartDate, flatGrowth, "Go"),
    ...buildDailySnapshots("decline/old-news", monthStartDate, negativeGrowth, "JavaScript"),
  ];

  return {
    snapshots: snapshots.sort((left, right) => {
      if (left.repo_full_name === right.repo_full_name) {
        return left.captured_at.localeCompare(right.captured_at);
      }

      return left.repo_full_name.localeCompare(right.repo_full_name);
    }),
  };
}
