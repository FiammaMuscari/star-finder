import {
  access,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const PARTITION_FILE_PATTERN = /^\d{4}-\d{2}\.json$/;

export const DEFAULT_SNAPSHOT_FILE_PATH = path.join(
  ROOT_DIR,
  "server-data",
  "trending-snapshots"
);

export const LEGACY_SNAPSHOT_FILE_PATH = path.join(
  ROOT_DIR,
  "server-data",
  "trending-snapshots.json"
);

export function resolveSnapshotFilePath(filePath) {
  return filePath || process.env.TRENDING_SNAPSHOT_FILE_PATH || DEFAULT_SNAPSHOT_FILE_PATH;
}

function isLegacySnapshotFilePath(filePath) {
  return path.extname(filePath).toLowerCase() === ".json";
}

function normalizeRepoFullName(repoFullName) {
  return typeof repoFullName === "string" ? repoFullName.trim() : "";
}

function getRepoFullNameKey(repoFullName) {
  return normalizeRepoFullName(repoFullName).toLowerCase();
}

function normalizeCapturedAt(date) {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized.toISOString();
}

function normalizeSnapshot(snapshot) {
  const repoFullName = normalizeRepoFullName(snapshot?.repo_full_name);

  if (!repoFullName) {
    return null;
  }

  return {
    repo_full_name: repoFullName,
    stars: Number(snapshot.stars) || 0,
    captured_at: normalizeCapturedAt(snapshot.captured_at),
    language: snapshot.language ?? null,
  };
}

function mergeAndSortSnapshots(...collections) {
  const byKey = new Map();

  collections.flat().forEach((snapshot) => {
    const normalizedSnapshot = normalizeSnapshot(snapshot);

    if (!normalizedSnapshot) {
      return;
    }

    const key = `${getRepoFullNameKey(normalizedSnapshot.repo_full_name)}:${normalizedSnapshot.captured_at}`;
    const previous = byKey.get(key);

    byKey.set(key, {
      ...normalizedSnapshot,
      language: normalizedSnapshot.language ?? previous?.language ?? null,
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

function getPartitionName(capturedAt) {
  return normalizeCapturedAt(capturedAt).slice(0, 7);
}

function getPartitionFilePath(storePath, partitionName) {
  return path.join(storePath, `${partitionName}.json`);
}

function getLegacyMigrationFilePath(storePath) {
  return isLegacySnapshotFilePath(storePath) ? storePath : `${storePath}.json`;
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readLegacySnapshotStore(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });

  if (!(await pathExists(filePath))) {
    await writeFile(filePath, JSON.stringify({ snapshots: [] }, null, 2) + "\n", "utf8");
  }

  const fileContents = await readFile(filePath, "utf8");
  const parsed = JSON.parse(fileContents);

  return {
    snapshots: mergeAndSortSnapshots(Array.isArray(parsed.snapshots) ? parsed.snapshots : []),
  };
}

async function listPartitionFiles(storePath) {
  if (!(await pathExists(storePath))) {
    return [];
  }

  const entries = await readdir(storePath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && PARTITION_FILE_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function readPartitionedSnapshotStore(storePath) {
  await mkdir(storePath, { recursive: true });

  const partitionFiles = await listPartitionFiles(storePath);
  const legacyMigrationFilePath = getLegacyMigrationFilePath(storePath);

  if (partitionFiles.length === 0 && (await pathExists(legacyMigrationFilePath))) {
    return readLegacySnapshotStore(legacyMigrationFilePath);
  }

  const snapshots = [];

  for (const partitionFile of partitionFiles) {
    const fileContents = await readFile(path.join(storePath, partitionFile), "utf8");
    const parsed = JSON.parse(fileContents);
    const partitionSnapshots = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.snapshots)
        ? parsed.snapshots
        : [];

    snapshots.push(...partitionSnapshots);
  }

  return {
    snapshots: mergeAndSortSnapshots(snapshots),
  };
}

async function writeLegacySnapshotStore(store, filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempFilePath = `${filePath}.tmp`;
  const payload = JSON.stringify(
    {
      snapshots: mergeAndSortSnapshots(store.snapshots),
    },
    null,
    2
  ) + "\n";

  await writeFile(tempFilePath, payload, "utf8");
  await rename(tempFilePath, filePath);
}

async function writePartitionedSnapshotStore(store, storePath) {
  await mkdir(storePath, { recursive: true });

  const mergedSnapshots = mergeAndSortSnapshots(store.snapshots);
  const snapshotsByPartition = new Map();

  mergedSnapshots.forEach((snapshot) => {
    const partitionName = getPartitionName(snapshot.captured_at);
    const existing = snapshotsByPartition.get(partitionName) || [];
    existing.push(snapshot);
    snapshotsByPartition.set(partitionName, existing);
  });

  for (const [partitionName, partitionSnapshots] of snapshotsByPartition.entries()) {
    const partitionFilePath = getPartitionFilePath(storePath, partitionName);
    const tempFilePath = `${partitionFilePath}.tmp`;
    const payload = JSON.stringify({ snapshots: partitionSnapshots }, null, 2) + "\n";

    await writeFile(tempFilePath, payload, "utf8");
    await rename(tempFilePath, partitionFilePath);
  }

  const existingPartitionFiles = await listPartitionFiles(storePath);

  for (const partitionFile of existingPartitionFiles) {
    const partitionName = partitionFile.slice(0, -5);

    if (!snapshotsByPartition.has(partitionName)) {
      await rm(path.join(storePath, partitionFile), { force: true });
    }
  }

  const metadataFilePath = path.join(storePath, "metadata.json");
  const metadataTempFilePath = `${metadataFilePath}.tmp`;
  const payload = JSON.stringify(
    {
      version: 1,
      partitioning: "monthly",
      partitions: Array.from(snapshotsByPartition.keys()).sort(),
      snapshotCount: mergedSnapshots.length,
      updatedAt: new Date().toISOString(),
    },
    null,
    2
  ) + "\n";

  await writeFile(metadataTempFilePath, payload, "utf8");
  await rename(metadataTempFilePath, metadataFilePath);

  const legacyMigrationFilePath = getLegacyMigrationFilePath(storePath);
  if (legacyMigrationFilePath !== storePath && (await pathExists(legacyMigrationFilePath))) {
    await unlink(legacyMigrationFilePath);
  }
}

export async function readSnapshotStore(filePath) {
  const resolvedPath = resolveSnapshotFilePath(filePath);

  if (isLegacySnapshotFilePath(resolvedPath)) {
    return readLegacySnapshotStore(resolvedPath);
  }

  return readPartitionedSnapshotStore(resolvedPath);
}

export async function writeSnapshotStore(store, filePath) {
  const resolvedPath = resolveSnapshotFilePath(filePath);

  if (isLegacySnapshotFilePath(resolvedPath)) {
    await writeLegacySnapshotStore(store, resolvedPath);
    return;
  }

  await writePartitionedSnapshotStore(store, resolvedPath);
}
