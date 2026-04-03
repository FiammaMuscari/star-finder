import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { writeSnapshotStore } from "../server/trending-snapshots.js";
import { getTrendingPayload } from "../server/trending-service.js";

const GITHUB_FIXTURE = `
<article class="Box-row">
  <h2 class="h3 lh-condensed">
    <a href="/alpha/one">
      <span class="text-normal">alpha /</span>
      one
    </a>
  </h2>
  <div class="f6 color-fg-muted mt-2">
    <span itemprop="programmingLanguage">TypeScript</span>
    <a href="/alpha/one/stargazers"><svg></svg>1,000</a>
    <span>120 stars today</span>
  </div>
</article>
<article class="Box-row">
  <h2 class="h3 lh-condensed">
    <a href="/beta/two">
      <span class="text-normal">beta /</span>
      two
    </a>
  </h2>
  <div class="f6 color-fg-muted mt-2">
    <span itemprop="programmingLanguage">Python</span>
    <a href="/beta/two/stargazers"><svg></svg>900</a>
    <span>90 stars today</span>
  </div>
</article>
`;

async function withSnapshotFile(snapshotStore, run) {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "star-finder-trending-service-"));
  const snapshotFilePath = path.join(tempDirectory, "trending-snapshots.json");
  const previousPath = process.env.TRENDING_SNAPSHOT_FILE_PATH;
  const previousSource = process.env.TRENDING_SOURCE;

  await writeSnapshotStore(snapshotStore, snapshotFilePath);
  process.env.TRENDING_SNAPSHOT_FILE_PATH = snapshotFilePath;
  delete process.env.TRENDING_SOURCE;

  try {
    await run();
  } finally {
    if (previousPath) {
      process.env.TRENDING_SNAPSHOT_FILE_PATH = previousPath;
    } else {
      delete process.env.TRENDING_SNAPSHOT_FILE_PATH;
    }

    if (previousSource) {
      process.env.TRENDING_SOURCE = previousSource;
    } else {
      delete process.env.TRENDING_SOURCE;
    }

    await rm(tempDirectory, { recursive: true, force: true });
  }
}

test("service backfills GitHub trending results with snapshot rising repos", async () => {
  const snapshotStore = {
    snapshots: [
      {
        repo_full_name: "alpha/one",
        stars: 850,
        language: "TypeScript",
        captured_at: "2026-04-02T00:00:00.000Z",
      },
      {
        repo_full_name: "alpha/one",
        stars: 1000,
        language: "TypeScript",
        captured_at: "2026-04-03T00:00:00.000Z",
      },
      {
        repo_full_name: "gamma/three",
        stars: 100,
        language: "Rust",
        captured_at: "2026-04-02T00:00:00.000Z",
      },
      {
        repo_full_name: "gamma/three",
        stars: 180,
        language: "Rust",
        captured_at: "2026-04-03T00:00:00.000Z",
      },
      {
        repo_full_name: "delta/four",
        stars: 200,
        language: "Go",
        captured_at: "2026-04-02T00:00:00.000Z",
      },
      {
        repo_full_name: "delta/four",
        stars: 250,
        language: "Go",
        captured_at: "2026-04-03T00:00:00.000Z",
      },
    ],
  };

  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    async text() {
      return GITHUB_FIXTURE;
    },
  });

  await withSnapshotFile(snapshotStore, async () => {
    const payload = await getTrendingPayload("today", "", {
      fetchImpl,
      limit: 4,
    });

    assert.equal(payload.ready, true);
    assert.deepEqual(
      payload.items.map((item) => item.repo_full_name),
      ["alpha/one", "beta/two", "gamma/three", "delta/four"]
    );
    assert.deepEqual(
      payload.items.map((item) => item.growth),
      [120, 90, 80, 50]
    );
  });
});
