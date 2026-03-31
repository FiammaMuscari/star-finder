import test from "node:test";
import assert from "node:assert/strict";
import { collectTrendingSnapshots } from "../scripts/update-trending-snapshots.mjs";

function createJsonResponse(payload, ok = true) {
  return {
    ok,
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
    },
  };
}

test("collection makes one search request and one repo request per unique missing repo", async () => {
  const calls = [];
  const snapshotStore = {
    snapshots: [
      {
        repo_full_name: "already/today",
        stars: 20,
        language: "Go",
        captured_at: "2026-03-26T00:00:00.000Z",
      },
      {
        repo_full_name: "tracked/history",
        stars: 8,
        captured_at: "2026-03-24T00:00:00.000Z",
      },
    ],
  };

  const fetchImpl = async (url) => {
    calls.push(url);

    if (url.includes("/search/repositories?")) {
      return createJsonResponse({
        items: [
          { full_name: "already/today" },
          { full_name: "tracked/history" },
          { full_name: "new/one" },
          { full_name: "new/one" },
        ],
      });
    }

    if (url.endsWith("/repos/tracked/history")) {
      return createJsonResponse({
        full_name: "tracked/history",
        stargazers_count: 15,
        language: "TypeScript",
      });
    }

    if (url.endsWith("/repos/new/one")) {
      return createJsonResponse({
        full_name: "new/one",
        stargazers_count: 40,
        language: "Python",
      });
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  const { snapshots, summary } = await collectTrendingSnapshots({
    snapshotStore,
    fetchImpl,
    headers: { Authorization: "Bearer test" },
    now: new Date("2026-03-26T12:00:00.000Z"),
    discoveryQueries: [
      {
        buildQuery() {
          return "created:>2026-02-25 stars:>20";
        },
      },
    ],
  });

  assert.equal(summary.searchRequests, 1);
  assert.equal(summary.uniqueRepoCount, 3);
  assert.equal(summary.repoRequests, 2);
  assert.equal(summary.skippedExistingToday, 1);
  assert.equal(summary.failedRepoRequests, 0);
  assert.equal(summary.snapshotsAdded, 2);
  assert.equal(snapshots.length, 4);
  assert.equal(
    snapshots.find((snapshot) => snapshot.repo_full_name === "tracked/history" && snapshot.captured_at === "2026-03-26T00:00:00.000Z")?.language,
    "TypeScript"
  );
  assert.equal(
    snapshots.find((snapshot) => snapshot.repo_full_name === "new/one")?.language,
    "Python"
  );
  assert.equal(calls.filter((url) => url.includes("/search/repositories?")).length, 1);
  assert.equal(calls.filter((url) => url.includes("/repos/")).length, 2);
});

test("collection prunes snapshots older than the retention window", async () => {
  const snapshotStore = {
    snapshots: [
      {
        repo_full_name: "old/repo",
        stars: 10,
        captured_at: "2025-12-01T00:00:00.000Z",
      },
      {
        repo_full_name: "recent/repo",
        stars: 20,
        captured_at: "2026-03-20T00:00:00.000Z",
      },
    ],
  };

  const fetchImpl = async (url) => {
    if (url.includes("/search/repositories?")) {
      return createJsonResponse({ items: [] });
    }

    if (url.endsWith("/repos/recent/repo")) {
      return createJsonResponse({
        full_name: "recent/repo",
        stargazers_count: 25,
      });
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  const { snapshots } = await collectTrendingSnapshots({
    snapshotStore,
    fetchImpl,
    headers: { Authorization: "Bearer test" },
    now: new Date("2026-03-26T12:00:00.000Z"),
    snapshotRetentionDays: 30,
    discoveryQueries: [
      {
        buildQuery() {
          return "created:>2026-02-25 stars:>20";
        },
      },
    ],
  });

  assert.deepEqual(
    snapshots.map((snapshot) => snapshot.repo_full_name),
    ["recent/repo", "recent/repo"]
  );
});

test("collection balances tracked repos and newly discovered repos with explicit quotas", async () => {
  const repoFetches = [];
  const snapshotStore = {
    snapshots: [
      {
        repo_full_name: "tracked/a",
        stars: 80,
        captured_at: "2026-03-20T00:00:00.000Z",
      },
      {
        repo_full_name: "tracked/b",
        stars: 70,
        captured_at: "2026-03-20T00:00:00.000Z",
      },
      {
        repo_full_name: "tracked/c",
        stars: 60,
        captured_at: "2026-03-20T00:00:00.000Z",
      },
    ],
  };

  const fetchImpl = async (url) => {
    if (url.includes("/search/repositories?")) {
      return createJsonResponse({
        items: [
          { full_name: "new/one" },
          { full_name: "new/two" },
          { full_name: "new/three" },
        ],
      });
    }

    repoFetches.push(url);
    const repoFullName = url.split("/repos/")[1];
    return createJsonResponse({
      full_name: repoFullName,
      stargazers_count: 100,
      language: "TypeScript",
    });
  };

  await collectTrendingSnapshots({
    snapshotStore,
    fetchImpl,
    headers: { Authorization: "Bearer test" },
    now: new Date("2026-03-26T12:00:00.000Z"),
    maxRepos: 4,
    trackedRepoQuota: 2,
    discoveryRepoQuota: 2,
    discoveryQueries: [
      {
        name: "mock-discovery",
        buildQuery() {
          return "created:>2026-02-25 stars:>20";
        },
      },
    ],
  });

  assert.deepEqual(
    repoFetches.map((url) => url.split("/repos/")[1]),
    ["tracked/a", "tracked/b", "new/one", "new/two"]
  );
});

test("collection deduplicates candidates returned by multiple discovery queries", async () => {
  const repoFetches = [];

  const fetchImpl = async (url) => {
    if (url.includes("/search/repositories?")) {
      if (url.includes("query-one")) {
        return createJsonResponse({
          items: [{ full_name: "shared/repo" }, { full_name: "only/first" }],
        });
      }

      return createJsonResponse({
        items: [{ full_name: "shared/repo" }, { full_name: "only/second" }],
      });
    }

    repoFetches.push(url.split("/repos/")[1]);
    return createJsonResponse({
      full_name: url.split("/repos/")[1],
      stargazers_count: 50,
      language: "JavaScript",
    });
  };

  const { summary } = await collectTrendingSnapshots({
    snapshotStore: { snapshots: [] },
    fetchImpl,
    headers: { Authorization: "Bearer test" },
    now: new Date("2026-03-26T12:00:00.000Z"),
    maxRepos: 5,
    discoveryQueries: [
      {
        name: "query-one",
        buildQuery() {
          return "query-one";
        },
      },
      {
        name: "query-two",
        buildQuery() {
          return "query-two";
        },
      },
    ],
  });

  assert.equal(summary.searchRequests, 2);
  assert.equal(summary.uniqueRepoCount, 3);
  assert.deepEqual(repoFetches, ["shared/repo", "only/first", "only/second"]);
});

test("repos outside the tracking window leave the tracked set", async () => {
  const repoFetches = [];
  const snapshotStore = {
    snapshots: [
      {
        repo_full_name: "stale/repo",
        stars: 80,
        captured_at: "2026-01-01T00:00:00.000Z",
      },
      {
        repo_full_name: "active/repo",
        stars: 42,
        captured_at: "2026-03-25T00:00:00.000Z",
      },
    ],
  };

  const fetchImpl = async (url) => {
    if (url.includes("/search/repositories?")) {
      return createJsonResponse({ items: [] });
    }

    repoFetches.push(url.split("/repos/")[1]);
    return createJsonResponse({
      full_name: url.split("/repos/")[1],
      stargazers_count: 60,
      language: "Go",
    });
  };

  const { summary } = await collectTrendingSnapshots({
    snapshotStore,
    fetchImpl,
    headers: { Authorization: "Bearer test" },
    now: new Date("2026-03-26T12:00:00.000Z"),
    trackedRepoWindowDays: 30,
    discoveryQueries: [
      {
        name: "mock-discovery",
        buildQuery() {
          return "created:>2026-02-25 stars:>20";
        },
      },
    ],
  });

  assert.equal(summary.trackedRepoCount, 1);
  assert.deepEqual(repoFetches, ["active/repo"]);
});

test("collection prioritizes tracked repos by recent growth instead of total stars", async () => {
  const repoFetches = [];
  const snapshotStore = {
    snapshots: [
      {
        repo_full_name: "big/stable",
        stars: 10_000,
        captured_at: "2026-03-25T00:00:00.000Z",
      },
      {
        repo_full_name: "big/stable",
        stars: 10_002,
        captured_at: "2026-03-26T00:00:00.000Z",
      },
      {
        repo_full_name: "small/rising",
        stars: 80,
        captured_at: "2026-03-25T00:00:00.000Z",
      },
      {
        repo_full_name: "small/rising",
        stars: 140,
        captured_at: "2026-03-26T00:00:00.000Z",
      },
    ],
  };

  const fetchImpl = async (url) => {
    if (url.includes("/search/repositories?")) {
      return createJsonResponse({ items: [] });
    }

    repoFetches.push(url.split("/repos/")[1]);
    return createJsonResponse({
      full_name: url.split("/repos/")[1],
      stargazers_count: 150,
      language: "TypeScript",
    });
  };

  await collectTrendingSnapshots({
    snapshotStore,
    fetchImpl,
    headers: { Authorization: "Bearer test" },
    now: new Date("2026-03-26T12:00:00.000Z"),
    maxRepos: 1,
    trackedRepoQuota: 1,
    discoveryRepoQuota: 0,
    discoveryQueries: [],
  });

  assert.deepEqual(repoFetches, ["small/rising"]);
});
