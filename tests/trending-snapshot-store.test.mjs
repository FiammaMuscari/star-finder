import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  readSnapshotStore,
  writeSnapshotStore,
} from "../server/trending-snapshots.js";

async function withTempDirectory(run) {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "star-finder-snapshot-store-"));

  try {
    await run(tempDirectory);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

test("partitioned snapshot store writes monthly files and metadata", async () => {
  await withTempDirectory(async (tempDirectory) => {
    const storePath = path.join(tempDirectory, "trending-snapshots");
    const snapshotStore = {
      snapshots: [
        {
          repo_full_name: "beta/two",
          stars: 25,
          captured_at: "2026-04-02T12:00:00.000Z",
          language: "Python",
        },
        {
          repo_full_name: "alpha/one",
          stars: 10,
          captured_at: "2026-03-31T18:00:00.000Z",
          language: "TypeScript",
        },
        {
          repo_full_name: "alpha/one",
          stars: 14,
          captured_at: "2026-04-01T01:00:00.000Z",
          language: null,
        },
      ],
    };

    await writeSnapshotStore(snapshotStore, storePath);

    const metadata = JSON.parse(await readFile(path.join(storePath, "metadata.json"), "utf8"));
    assert.deepEqual(metadata.partitions, ["2026-03", "2026-04"]);
    assert.equal(metadata.snapshotCount, 3);

    const marchPartition = JSON.parse(
      await readFile(path.join(storePath, "2026-03.json"), "utf8")
    );
    const aprilPartition = JSON.parse(
      await readFile(path.join(storePath, "2026-04.json"), "utf8")
    );

    assert.equal(marchPartition.snapshots.length, 1);
    assert.equal(aprilPartition.snapshots.length, 2);

    const reloadedStore = await readSnapshotStore(storePath);
    assert.deepEqual(reloadedStore.snapshots, [
      {
        repo_full_name: "alpha/one",
        stars: 10,
        captured_at: "2026-03-31T00:00:00.000Z",
        language: "TypeScript",
      },
      {
        repo_full_name: "alpha/one",
        stars: 14,
        captured_at: "2026-04-01T00:00:00.000Z",
        language: null,
      },
      {
        repo_full_name: "beta/two",
        stars: 25,
        captured_at: "2026-04-02T00:00:00.000Z",
        language: "Python",
      },
    ]);
  });
});

test("partitioned snapshot store migrates from legacy json on first write", async () => {
  await withTempDirectory(async (tempDirectory) => {
    const storePath = path.join(tempDirectory, "trending-snapshots");
    const legacyPath = `${storePath}.json`;

    await writeSnapshotStore(
      {
        snapshots: [
          {
            repo_full_name: "legacy/repo",
            stars: 42,
            captured_at: "2026-04-03T12:00:00.000Z",
            language: "Rust",
          },
        ],
      },
      legacyPath
    );

    const migratedStore = await readSnapshotStore(storePath);
    assert.equal(migratedStore.snapshots.length, 1);
    assert.equal(migratedStore.snapshots[0].repo_full_name, "legacy/repo");

    await writeSnapshotStore(migratedStore, storePath);

    const reloadedStore = await readSnapshotStore(storePath);
    assert.deepEqual(reloadedStore.snapshots, [
      {
        repo_full_name: "legacy/repo",
        stars: 42,
        captured_at: "2026-04-03T00:00:00.000Z",
        language: "Rust",
      },
    ]);

    await assert.rejects(() => readFile(legacyPath, "utf8"));
  });
});
