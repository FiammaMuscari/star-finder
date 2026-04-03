import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import handler from "../api/trending.js";
import {
  createSeedSnapshotStore,
  createSingleSnapshotStore,
} from "../server/trending-fixtures.js";
import { writeSnapshotStore } from "../server/trending-snapshots.js";

function createMockResponse() {
  const headers = new Map();
  const response = {
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      headers.set(name, value);
    },
    status(code) {
      response.statusCode = code;
      return {
        json(payload) {
          response.body = payload;
          return payload;
        },
      };
    },
  };

  return {
    response,
    getResult() {
      return {
        statusCode: response.statusCode,
        body: response.body,
        headers,
      };
    },
  };
}

async function withSnapshotFile(snapshotStore, run) {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "star-finder-trending-"));
  const snapshotFilePath = path.join(tempDirectory, "trending-snapshots.json");
  const previousPath = process.env.TRENDING_SNAPSHOT_FILE_PATH;
  const previousSource = process.env.TRENDING_SOURCE;

  await writeSnapshotStore(snapshotStore, snapshotFilePath);
  process.env.TRENDING_SNAPSHOT_FILE_PATH = snapshotFilePath;
  process.env.TRENDING_SOURCE = "snapshots";

  try {
    await run(snapshotFilePath);
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

test("api returns ready false when there is not enough history", async () => {
  await withSnapshotFile(createSingleSnapshotStore(), async () => {
    const { response, getResult } = createMockResponse();

    await handler({ url: "http://localhost/api/trending?period=today" }, response);

    const result = getResult();
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ready, false);
    assert.deepEqual(result.body.items, []);
    assert.equal(
      result.headers.get("Cache-Control"),
      "s-maxage=3600, stale-while-revalidate=86400"
    );
  });
});

test("api returns seeded trending data for today, week, and month", async () => {
  await withSnapshotFile(createSeedSnapshotStore(), async () => {
    const expectations = {
      today: "octo/rocket-db",
      week: "labs/new-wave",
      month: "octo/rocket-db",
    };

    for (const period of ["today", "week", "month"]) {
      const { response, getResult } = createMockResponse();

      await handler({ url: `http://localhost/api/trending?period=${period}` }, response);

      const result = getResult();
      assert.equal(result.statusCode, 200);
      assert.equal(result.body.ready, true);
      assert.equal(result.body.period, period);
      assert.equal(result.body.items[0].repo_full_name, expectations[period]);
    }
  });
});

test("api filters trending data by language before returning the top 10", async () => {
  await withSnapshotFile(createSeedSnapshotStore(), async () => {
    const { response, getResult } = createMockResponse();

    await handler(
      { url: "http://localhost/api/trending?period=today&language=TypeScript" },
      response
    );

    const result = getResult();
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ready, true);
    assert.deepEqual(
      result.body.items.map((item) => item.repo_full_name),
      ["octo/rocket-db", "acme/ui-kit"]
    );
    assert.deepEqual(
      result.body.items.map((item) => item.language),
      ["TypeScript", "TypeScript"]
    );
  });
});
