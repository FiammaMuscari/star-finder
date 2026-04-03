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

function normalizeRepoFullName(repoFullName) {
  return typeof repoFullName === "string" ? repoFullName.trim() : "";
}

function getRepoFullNameKey(repoFullName) {
  return normalizeRepoFullName(repoFullName).toLowerCase();
}

export function mergeSnapshots(existingSnapshots, incomingSnapshots) {
  const byKey = new Map();

  [...existingSnapshots, ...incomingSnapshots].forEach((snapshot) => {
    const repoFullName = normalizeRepoFullName(snapshot.repo_full_name);

    if (!repoFullName) {
      return;
    }

    const capturedAt = normalizeCapturedAt(snapshot.captured_at);
    const key = `${getRepoFullNameKey(repoFullName)}:${capturedAt}`;
    const previous = byKey.get(key);
    byKey.set(key, {
      repo_full_name: repoFullName,
      stars: snapshot.stars,
      captured_at: capturedAt,
      language: snapshot.language ?? previous?.language ?? null,
    });
  });

  return Array.from(byKey.values()).sort((left, right) => {
    const leftKey = getRepoFullNameKey(left.repo_full_name);
    const rightKey = getRepoFullNameKey(right.repo_full_name);

    if (leftKey === rightKey) {
      return left.captured_at.localeCompare(right.captured_at);
    }

    return leftKey.localeCompare(rightKey);
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
  const repoNames = new Map();

  snapshots.forEach((snapshot) => {
    if (new Date(snapshot.captured_at).getTime() >= cutoff) {
      const repoFullName = normalizeRepoFullName(snapshot.repo_full_name);

      if (!repoFullName) {
        return;
      }

      repoNames.set(getRepoFullNameKey(repoFullName), repoFullName);
    }
  });

  return Array.from(repoNames.values());
}

function compareSnapshotsByCapturedAt(left, right) {
  return left.captured_at.localeCompare(right.captured_at);
}

function hasFreshBaseline(latest, baseline, period) {
  if (!baseline) {
    return false;
  }

  const latestTime = new Date(latest.captured_at).getTime();
  const baselineTime = new Date(baseline.captured_at).getTime();
  const actualWindowDays = (latestTime - baselineTime) / 86400000;
  const maxAllowedWindowDays =
    period === "today" ? 2 : period === "week" ? 9 : 35;

  return actualWindowDays <= maxAllowedWindowDays;
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

function matchesLanguage(comparison, normalizedLanguage) {
  if (!normalizedLanguage) {
    return true;
  }

  return comparison.latest.language === normalizedLanguage;
}

function getAvailableComparisons(snapshotStore, period, language = "") {
  const normalizedLanguage = normalizeLanguage(language);
  const { comparisons } = buildTrendingComparisons(snapshotStore, period);

  return comparisons.filter((comparison) => {
    if (!hasPositiveGrowth(comparison)) {
      return false;
    }

    return matchesLanguage(comparison, normalizedLanguage);
  });
}

export function buildTrendingComparisons(snapshotStore, period) {
  const normalizedPeriod = normalizePeriod(period);
  const days = PERIOD_DAYS[normalizedPeriod];
  const snapshots = Array.isArray(snapshotStore.snapshots) ? snapshotStore.snapshots : [];
  const snapshotsByRepo = new Map();

  snapshots.forEach((snapshot) => {
    const repoFullName = normalizeRepoFullName(snapshot.repo_full_name);
    const repoKey = getRepoFullNameKey(repoFullName);

    if (!repoKey) {
      return;
    }

    const existing = snapshotsByRepo.get(repoKey) || [];
    existing.push({
      ...snapshot,
      repo_full_name: repoFullName,
    });
    snapshotsByRepo.set(repoKey, existing);
  });

  const comparisons = [];

  for (const repoSnapshots of snapshotsByRepo.values()) {
    const ordered = [...repoSnapshots].sort(compareSnapshotsByCapturedAt);
    const latest = ordered[ordered.length - 1];
    const repoFullName = latest.repo_full_name;
    const cutoffTime = new Date(latest.captured_at).getTime() - days * 86400000;
    const requiredCapturedAt = new Date(cutoffTime).toISOString();
    const baseline = [...ordered]
      .reverse()
      .find((snapshot) => new Date(snapshot.captured_at).getTime() <= cutoffTime);
    const available = hasFreshBaseline(latest, baseline, normalizedPeriod);

    comparisons.push({
      repo_full_name: repoFullName,
      available,
      growth: available ? Math.max(0, latest.stars - baseline.stars) : null,
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
  const { period: normalizedPeriod, days, comparisons } = buildTrendingComparisons(snapshotStore, period);
  const normalizedLanguage = normalizeLanguage(language);
  const readyItems = comparisons
    .filter((comparison) => hasPositiveGrowth(comparison) && matchesLanguage(comparison, normalizedLanguage))
    .map((comparison) => ({
      repo_full_name: comparison.repo_full_name,
      stars: comparison.latest.stars,
      growth: comparison.growth,
      language: comparison.latest.language,
      captured_at: comparison.latest.captured_at,
    }));
  const supplementalItems =
    normalizedLanguage && readyItems.length > 0 && readyItems.length < limit
      ? comparisons
          .filter((comparison) => matchesLanguage(comparison, normalizedLanguage))
          .filter((comparison) => !readyItems.some((item) => item.repo_full_name === comparison.repo_full_name))
          .map((comparison) => ({
            repo_full_name: comparison.repo_full_name,
            stars: comparison.latest.stars,
            growth: comparison.growth,
            language: comparison.latest.language,
            captured_at: comparison.latest.captured_at,
          }))
      : [];
  const limitedItems = [...readyItems, ...supplementalItems].slice(0, limit);
  const isReady = readyItems.length > 0;
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
