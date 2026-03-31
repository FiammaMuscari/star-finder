export const PERIOD_DAYS = {
  today: 1,
  week: 7,
  month: 30,
};

export function normalizePeriod(period) {
  return PERIOD_DAYS[period] ? period : "today";
}

export function normalizeLanguage(language) {
  if (!language) {
    return "";
  }

  return language.trim();
}

export function normalizeCapturedAt(date) {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized.toISOString();
}

export function mergeSnapshots(existingSnapshots, incomingSnapshots) {
  const byKey = new Map();

  [...existingSnapshots, ...incomingSnapshots].forEach((snapshot) => {
    const capturedAt = normalizeCapturedAt(snapshot.captured_at);
    const key = `${snapshot.repo_full_name}:${capturedAt}`;
    const previous = byKey.get(key);
    byKey.set(key, {
      repo_full_name: snapshot.repo_full_name,
      stars: snapshot.stars,
      captured_at: capturedAt,
      language: snapshot.language ?? previous?.language ?? null,
    });
  });

  return Array.from(byKey.values()).sort((left, right) => {
    if (left.repo_full_name === right.repo_full_name) {
      return left.captured_at.localeCompare(right.captured_at);
    }

    return left.repo_full_name.localeCompare(right.repo_full_name);
  });
}

export function pruneSnapshots(snapshots, daysToKeep = 90) {
  const cutoff = Date.now() - daysToKeep * 86400000;

  return snapshots.filter((snapshot) => {
    return new Date(snapshot.captured_at).getTime() >= cutoff;
  });
}

export function getTrackedRepoNames(snapshots, daysBack = 45) {
  const cutoff = Date.now() - daysBack * 86400000;
  const repoNames = new Set();

  snapshots.forEach((snapshot) => {
    if (new Date(snapshot.captured_at).getTime() >= cutoff) {
      repoNames.add(snapshot.repo_full_name);
    }
  });

  return Array.from(repoNames);
}

function compareSnapshotsByCapturedAt(left, right) {
  return left.captured_at.localeCompare(right.captured_at);
}

function compareTrendingComparisons(left, right) {
  if (left.available !== right.available) {
    return left.available ? -1 : 1;
  }

  if ((right.growth || 0) === (left.growth || 0)) {
    return right.latest.stars - left.latest.stars;
  }

  return (right.growth || 0) - (left.growth || 0);
}

function hasPositiveGrowth(comparison) {
  return comparison.available && typeof comparison.growth === "number" && comparison.growth > 0;
}

function getAvailableComparisons(snapshotStore, period, language = "") {
  const normalizedLanguage = normalizeLanguage(language);
  const { comparisons } = buildTrendingComparisons(snapshotStore, period);

  return comparisons.filter((comparison) => {
    if (!hasPositiveGrowth(comparison)) {
      return false;
    }

    if (!normalizedLanguage) {
      return true;
    }

    return comparison.latest.language === normalizedLanguage;
  });
}

export function buildTrendingComparisons(snapshotStore, period) {
  const normalizedPeriod = normalizePeriod(period);
  const days = PERIOD_DAYS[normalizedPeriod];
  const snapshots = Array.isArray(snapshotStore.snapshots) ? snapshotStore.snapshots : [];
  const snapshotsByRepo = new Map();

  snapshots.forEach((snapshot) => {
    const existing = snapshotsByRepo.get(snapshot.repo_full_name) || [];
    existing.push(snapshot);
    snapshotsByRepo.set(snapshot.repo_full_name, existing);
  });

  const comparisons = [];

  for (const [repoFullName, repoSnapshots] of snapshotsByRepo.entries()) {
    const ordered = [...repoSnapshots].sort(compareSnapshotsByCapturedAt);
    const latest = ordered[ordered.length - 1];
    const cutoffTime = new Date(latest.captured_at).getTime() - days * 86400000;
    const requiredCapturedAt = new Date(cutoffTime).toISOString();
    const baseline = [...ordered]
      .reverse()
      .find((snapshot) => new Date(snapshot.captured_at).getTime() <= cutoffTime);

    comparisons.push({
      repo_full_name: repoFullName,
      available: Boolean(baseline),
      growth: baseline ? Math.max(0, latest.stars - baseline.stars) : null,
      latest: {
        stars: latest.stars,
        captured_at: latest.captured_at,
        language: latest.language ?? null,
      },
      baseline: baseline
        ? {
            stars: baseline.stars,
            captured_at: baseline.captured_at,
          }
        : null,
      required_captured_at: requiredCapturedAt,
    });
  }

  return {
    period: normalizedPeriod,
    days,
    comparisons: comparisons.sort(compareTrendingComparisons),
  };
}

export function buildPeriodAvailability(snapshotStore, language = "") {
  return {
    today: getAvailableComparisons(snapshotStore, "today", language).length > 0,
    week: getAvailableComparisons(snapshotStore, "week", language).length > 0,
    month: getAvailableComparisons(snapshotStore, "month", language).length > 0,
  };
}

export function buildTrendingResponse(snapshotStore, period, limit = 10, language = "") {
  const { period: normalizedPeriod, days } = buildTrendingComparisons(
    snapshotStore,
    period
  );
  const normalizedLanguage = normalizeLanguage(language);
  const items = getAvailableComparisons(snapshotStore, normalizedPeriod, normalizedLanguage)
    .map((comparison) => ({
      repo_full_name: comparison.repo_full_name,
      stars: comparison.latest.stars,
      growth: comparison.growth,
      language: comparison.latest.language,
      captured_at: comparison.latest.captured_at,
    }));
  const limitedItems = items.slice(0, limit);
  const isReady = limitedItems.length > 0;
  const periodAvailability = buildPeriodAvailability(snapshotStore, normalizedLanguage);

  return {
    period: normalizedPeriod,
    days,
    ready: isReady,
    periodAvailability,
    message: isReady
      ? null
      : normalizedPeriod === "today"
        ? "trendingCollectingToday"
        : normalizedPeriod === "week"
          ? "trendingCollectingWeek"
          : "trendingCollectingMonth",
    items: limitedItems,
  };
}
