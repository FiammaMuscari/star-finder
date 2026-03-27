import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTrendingComparisons,
  buildTrendingResponse,
} from "../server/trending.js";
import {
  createEdgeCaseSnapshotStore,
  createSeedSnapshotStore,
  createSingleSnapshotStore,
} from "../server/trending-fixtures.js";

test("today is not ready when only one snapshot day exists", () => {
  const payload = buildTrendingResponse(createSingleSnapshotStore(), "today");

  assert.equal(payload.ready, false);
  assert.deepEqual(payload.items, []);
});

test("today, week, and month use real snapshot deltas and sort by growth", () => {
  const snapshotStore = createSeedSnapshotStore();

  const today = buildTrendingResponse(snapshotStore, "today");
  assert.equal(today.ready, true);
  assert.deepEqual(
    today.items.map((item) => item.repo_full_name),
    ["octo/rocket-db", "labs/new-wave", "acme/ui-kit"]
  );
  assert.deepEqual(
    today.items.map((item) => item.growth),
    [15, 12, 3]
  );

  const week = buildTrendingResponse(snapshotStore, "week");
  assert.equal(week.ready, true);
  assert.deepEqual(
    week.items.map((item) => item.repo_full_name),
    ["labs/new-wave", "octo/rocket-db", "acme/ui-kit"]
  );
  assert.deepEqual(
    week.items.map((item) => item.growth),
    [63, 39, 15]
  );

  const month = buildTrendingResponse(snapshotStore, "month");
  assert.equal(month.ready, true);
  assert.deepEqual(
    month.items.map((item) => item.repo_full_name),
    ["octo/rocket-db", "acme/ui-kit"]
  );
  assert.deepEqual(
    month.items.map((item) => item.growth),
    [131, 61]
  );
});

test("repos without enough history stay unavailable until a valid baseline exists", () => {
  const snapshotStore = createSeedSnapshotStore();
  const { comparisons } = buildTrendingComparisons(snapshotStore, "month");

  const freshStart = comparisons.find(
    (comparison) => comparison.repo_full_name === "solo/fresh-start"
  );
  const newWave = comparisons.find(
    (comparison) => comparison.repo_full_name === "labs/new-wave"
  );

  assert.equal(freshStart?.available, false);
  assert.equal(freshStart?.baseline, null);
  assert.equal(newWave?.available, false);
  assert.equal(newWave?.baseline, null);
  assert.equal(newWave?.required_captured_at, "2026-02-24T00:00:00.000Z");
});

test("language filtering keeps the top 10 ranking within the selected language", () => {
  const snapshotStore = createSeedSnapshotStore();
  const payload = buildTrendingResponse(snapshotStore, "today", 10, "TypeScript");

  assert.equal(payload.ready, true);
  assert.deepEqual(
    payload.items.map((item) => item.repo_full_name),
    ["octo/rocket-db", "acme/ui-kit"]
  );
  assert.deepEqual(
    payload.items.map((item) => item.language),
    ["TypeScript", "TypeScript"]
  );
});

test("low-star fast movers outrank huge repos with weak recent growth", () => {
  const snapshotStore = createEdgeCaseSnapshotStore();
  const today = buildTrendingResponse(snapshotStore, "today");
  const week = buildTrendingResponse(snapshotStore, "week");

  assert.equal(today.items[0].repo_full_name, "indie/rocket-launch");
  assert.equal(week.items[0].repo_full_name, "indie/rocket-launch");
  assert.equal(today.items.find((item) => item.repo_full_name === "mega/legacy-platform")?.growth, 2);
});

test("zero and negative growth are clamped to zero without breaking ranking", () => {
  const snapshotStore = createEdgeCaseSnapshotStore();
  const week = buildTrendingResponse(snapshotStore, "week");

  assert.equal(
    week.items.find((item) => item.repo_full_name === "stable/quiet-engine")?.growth,
    0
  );
  assert.equal(
    week.items.find((item) => item.repo_full_name === "decline/old-news")?.growth,
    0
  );
});
