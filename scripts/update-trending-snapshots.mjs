import { pathToFileURL } from "node:url";
import { loadEnv } from "vite";
import {
  TRENDING_COLLECTION_CONFIG,
  getDiscoveryQueriesForDate,
} from "../server/trending-config.js";
import {
  readSnapshotStore,
  resolveSnapshotFilePath,
  writeSnapshotStore,
} from "../server/trending-snapshots.js";
import {
  mergeSnapshots,
  normalizeCapturedAt,
  pruneSnapshots,
} from "../server/trending.js";

const loadedEnv = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");

for (const [key, value] of Object.entries(loadedEnv)) {
  if (!(key in process.env)) {
    process.env[key] = value;
  }
}

function resolveGitHubToken() {
  return (
    process.env.GITHUB_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.VITE_GITHUB_TOKEN ||
    ""
  );
}

export function createGitHubHeaders(token = resolveGitHubToken()) {
  if (!token) {
    throw new Error(
      "A GitHub token is required to update trending snapshots. Set GITHUB_TOKEN, GITHUB_PAT, or VITE_GITHUB_TOKEN."
    );
  }

  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "star-finder-snapshots",
  };
}

export function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function normalizeRepoFullName(repoFullName) {
  return typeof repoFullName === "string" ? repoFullName.trim() : "";
}

function getRepoFullNameKey(repoFullName) {
  return normalizeRepoFullName(repoFullName).toLowerCase();
}

function resolveCanonicalRepoFullName(repoAliases, repoFullName) {
  let canonicalRepoFullName = normalizeRepoFullName(repoFullName);
  const seen = new Set();

  while (canonicalRepoFullName) {
    const repoKey = getRepoFullNameKey(canonicalRepoFullName);

    if (!repoKey || seen.has(repoKey)) {
      break;
    }

    seen.add(repoKey);
    const nextRepoFullName = repoAliases.get(repoKey);

    if (!nextRepoFullName || nextRepoFullName === canonicalRepoFullName) {
      break;
    }

    canonicalRepoFullName = nextRepoFullName;
  }

  return canonicalRepoFullName;
}

function registerRepoAlias(repoAliases, repoFullName, canonicalRepoFullName) {
  const normalizedRepoFullName = normalizeRepoFullName(repoFullName);
  const resolvedCanonicalRepoFullName = resolveCanonicalRepoFullName(
    repoAliases,
    canonicalRepoFullName
  );

  if (!normalizedRepoFullName || !resolvedCanonicalRepoFullName) {
    return;
  }

  repoAliases.set(getRepoFullNameKey(normalizedRepoFullName), resolvedCanonicalRepoFullName);
  repoAliases.set(
    getRepoFullNameKey(resolvedCanonicalRepoFullName),
    resolvedCanonicalRepoFullName
  );
}

function canonicalizeSnapshotsByRepoName(snapshots, repoAliases) {
  return snapshots.map((snapshot) => {
    const repoFullName = normalizeRepoFullName(snapshot.repo_full_name);
    const canonicalRepoFullName = resolveCanonicalRepoFullName(repoAliases, repoFullName);

    if (!canonicalRepoFullName || canonicalRepoFullName === snapshot.repo_full_name) {
      return repoFullName === snapshot.repo_full_name
        ? snapshot
        : {
            ...snapshot,
            repo_full_name: repoFullName,
          };
    }

    return {
      ...snapshot,
      repo_full_name: canonicalRepoFullName,
    };
  });
}

function compareSnapshotsByCapturedAt(left, right) {
  return left.captured_at.localeCompare(right.captured_at);
}

function getLatestTrackedRepos(snapshots, now, trackedRepoWindowDays, maxRepos) {
  const cutoff = now.getTime() - trackedRepoWindowDays * 86400000;
  const snapshotsByRepo = new Map();

  snapshots.forEach((snapshot) => {
    const capturedAtTime = new Date(snapshot.captured_at).getTime();

    if (capturedAtTime < cutoff) {
      return;
    }

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

  return Array.from(snapshotsByRepo.values())
    .map((repoSnapshots) => {
      const ordered = [...repoSnapshots].sort(compareSnapshotsByCapturedAt);
      const latest = ordered[ordered.length - 1];
      const previous = ordered[ordered.length - 2] || null;
      const recentGrowth = previous ? Math.max(0, latest.stars - previous.stars) : 0;

      return {
        repoFullName: latest.repo_full_name,
        latest,
        recentGrowth,
      };
    })
    .sort((left, right) => {
      if (right.recentGrowth !== left.recentGrowth) {
        return right.recentGrowth - left.recentGrowth;
      }

      const capturedAtDiff =
        new Date(right.latest.captured_at).getTime() - new Date(left.latest.captured_at).getTime();

      if (capturedAtDiff !== 0) {
        return capturedAtDiff;
      }

      return right.latest.stars - left.latest.stars;
    })
    .slice(0, maxRepos);
}

function selectCandidateRepoNames({
  trackedRepoEntries,
  discoveredRepos,
  discoveryResults,
  maxRepos,
  trackedRepoQuota,
  discoveryRepoQuota,
  minimumLanguageCandidates,
}) {
  const selected = [];
  const selectedSet = new Set();
  const remainingTracked = [];
  const languageResults = new Map();
  const supportedLanguages = new Set();
  const coverageCounts = new Map();
  let trackedSelectedCount = 0;
  let discoveredSelectedCount = 0;

  discoveryResults.forEach((result) => {
    if (!result.language) {
      return;
    }

    languageResults.set(result.language, result.repoNames);
    supportedLanguages.add(result.language);
  });

  function addSelectedRepo(repoFullName, source) {
    const normalizedRepoFullName = normalizeRepoFullName(repoFullName);
    const repoKey = getRepoFullNameKey(normalizedRepoFullName);

    if (!repoKey || selectedSet.has(repoKey) || selected.length >= maxRepos) {
      return false;
    }

    selected.push(normalizedRepoFullName);
    selectedSet.add(repoKey);

    if (source === "tracked") {
      trackedSelectedCount += 1;
    }

    if (source === "discovered") {
      discoveredSelectedCount += 1;
    }

    return true;
  }

  for (const entry of trackedRepoEntries) {
    const language = entry.latest.language ?? "";
    const languageCount = coverageCounts.get(language) || 0;
    const contributesToCoverage =
      trackedSelectedCount < trackedRepoQuota &&
      supportedLanguages.has(language) &&
      languageCount < minimumLanguageCandidates;

    if (contributesToCoverage && addSelectedRepo(entry.repoFullName, "tracked")) {
      coverageCounts.set(language, languageCount + 1);
      continue;
    }

    remainingTracked.push(entry.repoFullName);
  }

  for (const language of supportedLanguages) {
    const repoNames = languageResults.get(language) || [];
    let remainingNeeded = minimumLanguageCandidates - (coverageCounts.get(language) || 0);

    for (const repoFullName of repoNames) {
      if (remainingNeeded <= 0 || selected.length >= maxRepos) {
        break;
      }

      if (addSelectedRepo(repoFullName, "discovered")) {
        remainingNeeded -= 1;
      }
    }
  }

  for (const repoFullName of remainingTracked) {
    if (trackedSelectedCount >= trackedRepoQuota || selected.length >= maxRepos) {
      break;
    }

    addSelectedRepo(repoFullName, "tracked");
  }

  for (const repoFullName of discoveredRepos) {
    if (discoveredSelectedCount >= discoveryRepoQuota || selected.length >= maxRepos) {
      break;
    }

    addSelectedRepo(repoFullName, "discovered");
  }

  for (const repoFullName of remainingTracked) {
    if (selected.length >= maxRepos) {
      break;
    }

    addSelectedRepo(repoFullName, "tracked");
  }

  for (const repoFullName of discoveredRepos) {
    if (selected.length >= maxRepos) {
      break;
    }

    addSelectedRepo(repoFullName, "discovered");
  }

  return selected.slice(0, maxRepos);
}

export async function discoverCandidates({
  fetchImpl = fetch,
  headers = createGitHubHeaders(),
  now = new Date(),
  discoveryQueries = getDiscoveryQueriesForDate(now),
  maxDiscoveryResultsPerQuery = TRENDING_COLLECTION_CONFIG.maxDiscoveryResultsPerQuery,
  recentCreatedWindowDays = TRENDING_COLLECTION_CONFIG.recentCreatedWindowDays,
  recentlyPushedWindowDays = TRENDING_COLLECTION_CONFIG.recentlyPushedWindowDays,
} = {}) {
  const createdAfter = formatDate(new Date(now.getTime() - recentCreatedWindowDays * 86400000));
  const pushedAfter = formatDate(new Date(now.getTime() - recentlyPushedWindowDays * 86400000));
  const discoveredRepoNames = [];
  const seenRepoNames = new Set();
  const queryResults = [];
  let searchRequests = 0;

  for (const query of discoveryQueries) {
    const params = new URLSearchParams({
      q: query.buildQuery({ createdAfter, pushedAfter }),
      sort: query.sortBy || "stars",
      order: query.order || "desc",
      per_page: String(query.maxResults || maxDiscoveryResultsPerQuery),
      page: "1",
    });

    const response = await fetchImpl(`https://api.github.com/search/repositories?${params}`, {
      headers,
    });
    searchRequests += 1;

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(`Failed to discover trending candidates: ${payload}`);
    }

    const data = await response.json();
    queryResults.push({
      name: query.name || null,
      language: query.language || "",
      repoNames: (data.items || [])
        .map((repo) => normalizeRepoFullName(repo.full_name))
        .filter(Boolean),
    });
  }

  const maxResultLength = queryResults.reduce(
    (maxLength, result) => Math.max(maxLength, result.repoNames.length),
    0
  );

  for (let index = 0; index < maxResultLength; index += 1) {
    queryResults.forEach((result) => {
      const repoName = normalizeRepoFullName(result.repoNames[index]);
      const repoKey = getRepoFullNameKey(repoName);

      if (!repoKey || seenRepoNames.has(repoKey)) {
        return;
      }

      seenRepoNames.add(repoKey);
      discoveredRepoNames.push(repoName);
    });
  }

  return {
    repoNames: discoveredRepoNames,
    discoveryResults: queryResults,
    searchRequests,
  };
}

export async function fetchRepoStars(
  repoFullName,
  {
    fetchImpl = fetch,
    headers = createGitHubHeaders(),
    capturedAt = normalizeCapturedAt(new Date().toISOString()),
  } = {}
) {
  const response = await fetchImpl(`https://api.github.com/repos/${repoFullName}`, {
    headers,
  });

  if (!response.ok) {
    return null;
  }

  const repo = await response.json();
  return {
    repo_full_name: normalizeRepoFullName(repo.full_name),
    stars: repo.stargazers_count,
    language: repo.language ?? null,
    captured_at: capturedAt,
  };
}

export async function collectTrendingSnapshots({
  snapshotStore,
  fetchImpl = fetch,
  headers = createGitHubHeaders(),
  maxRepos = TRENDING_COLLECTION_CONFIG.maxTrackedRepos,
  now = new Date(),
  trackedRepoQuota = TRENDING_COLLECTION_CONFIG.trackedRepoQuota,
  discoveryRepoQuota = TRENDING_COLLECTION_CONFIG.discoveryRepoQuota,
  trackedRepoWindowDays = TRENDING_COLLECTION_CONFIG.trackedRepoWindowDays,
  snapshotRetentionDays = TRENDING_COLLECTION_CONFIG.snapshotRetentionDays,
  discoveryQueries = getDiscoveryQueriesForDate(now),
  maxDiscoveryResultsPerQuery = TRENDING_COLLECTION_CONFIG.maxDiscoveryResultsPerQuery,
  minimumLanguageCandidates = TRENDING_COLLECTION_CONFIG.minimumLanguageCandidates,
} = {}) {
  const trackedRepoEntries = getLatestTrackedRepos(
    snapshotStore.snapshots,
    now,
    trackedRepoWindowDays,
    maxRepos
  );
  const { repoNames: discoveredRepos, discoveryResults, searchRequests } = await discoverCandidates({
    fetchImpl,
    headers,
    now,
    discoveryQueries,
    maxDiscoveryResultsPerQuery,
  });
  const repoNames = selectCandidateRepoNames({
    trackedRepoEntries,
    discoveredRepos,
    discoveryResults,
    maxRepos,
    trackedRepoQuota,
    discoveryRepoQuota,
    minimumLanguageCandidates,
  });
  const todayKey = normalizeCapturedAt(now.toISOString());
  const repoAliases = new Map();
  const existingToday = new Map(
    snapshotStore.snapshots
      .filter((snapshot) => snapshot.captured_at === todayKey)
      .map((snapshot) => [getRepoFullNameKey(snapshot.repo_full_name), snapshot])
  );
  const newSnapshots = [];
  let repoRequests = 0;
  let skippedExistingToday = 0;
  let failedRepoRequests = 0;

  for (const repoFullName of repoNames) {
    const requestedRepoFullName = resolveCanonicalRepoFullName(repoAliases, repoFullName);
    const existingSnapshot = existingToday.get(getRepoFullNameKey(requestedRepoFullName));

    if (existingSnapshot && existingSnapshot.language) {
      skippedExistingToday += 1;
      continue;
    }

    repoRequests += 1;
    const snapshot = await fetchRepoStars(requestedRepoFullName, {
      fetchImpl,
      headers,
      capturedAt: todayKey,
    });

    if (snapshot) {
      registerRepoAlias(repoAliases, repoFullName, snapshot.repo_full_name);

      const canonicalSnapshot = {
        ...snapshot,
        repo_full_name: resolveCanonicalRepoFullName(repoAliases, snapshot.repo_full_name),
      };

      newSnapshots.push(canonicalSnapshot);
      existingToday.set(getRepoFullNameKey(canonicalSnapshot.repo_full_name), canonicalSnapshot);
    } else {
      failedRepoRequests += 1;
    }
  }

  const canonicalSnapshots = canonicalizeSnapshotsByRepoName(
    snapshotStore.snapshots,
    repoAliases
  );
  const canonicalNewSnapshots = canonicalizeSnapshotsByRepoName(newSnapshots, repoAliases);
  const mergedSnapshots = pruneSnapshots(
    mergeSnapshots(canonicalSnapshots, canonicalNewSnapshots),
    snapshotRetentionDays
  );

  return {
    snapshots: mergedSnapshots,
    summary: {
      snapshotFilePath: null,
      searchRequests,
      repoRequests,
      skippedExistingToday,
      failedRepoRequests,
      trackedRepoCount: trackedRepoEntries.length,
      discoveredRepoCount: discoveredRepos.length,
      uniqueRepoCount: repoNames.length,
      snapshotsAdded: newSnapshots.length,
      totalSnapshots: mergedSnapshots.length,
      maxTrackedRepos: maxRepos,
      trackedRepoQuota,
      discoveryRepoQuota,
      minimumLanguageCandidates,
      trackedRepoWindowDays,
      snapshotRetentionDays,
      activeDiscoveryQueryNames: discoveryQueries.map((query) => query.name),
    },
  };
}

export async function main({ filePath } = {}) {
  const resolvedFilePath = resolveSnapshotFilePath(filePath);
  const snapshotStore = await readSnapshotStore(resolvedFilePath);
  const { snapshots, summary } = await collectTrendingSnapshots({ snapshotStore });

  await writeSnapshotStore(
    {
      snapshots,
    },
    resolvedFilePath
  );

  return {
    filePath: resolvedFilePath,
    summary: {
      ...summary,
      snapshotFilePath: resolvedFilePath,
    },
  };
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main()
    .then(({ filePath, summary }) => {
      console.log(`Snapshot file: ${filePath}`);
      console.log(`Search requests: ${summary.searchRequests}`);
      console.log(`Repository requests: ${summary.repoRequests}`);
      console.log(`Skipped existing today: ${summary.skippedExistingToday}`);
      console.log(`Failed repository requests: ${summary.failedRepoRequests}`);
      console.log(`Unique repositories considered: ${summary.uniqueRepoCount}`);
      console.log(`Max tracked repositories: ${summary.maxTrackedRepos}`);
      console.log(`Tracked repo quota: ${summary.trackedRepoQuota}`);
      console.log(`Discovery repo quota: ${summary.discoveryRepoQuota}`);
      console.log(`Tracking window (days): ${summary.trackedRepoWindowDays}`);
      console.log(`Snapshot retention (days): ${summary.snapshotRetentionDays}`);
      console.log(`Active discovery queries: ${summary.activeDiscoveryQueryNames.join(", ")}`);
      console.log(`Snapshots added: ${summary.snapshotsAdded}`);
      console.log(`Total stored snapshots: ${summary.totalSnapshots}`);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
