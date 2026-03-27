import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

export const DEFAULT_SNAPSHOT_FILE_PATH = path.join(
  ROOT_DIR,
  "server-data",
  "trending-snapshots.json"
);

export function resolveSnapshotFilePath(filePath) {
  return filePath || process.env.TRENDING_SNAPSHOT_FILE_PATH || DEFAULT_SNAPSHOT_FILE_PATH;
}

async function ensureSnapshotFile(filePath) {
  const resolvedPath = resolveSnapshotFilePath(filePath);
  await mkdir(path.dirname(resolvedPath), { recursive: true });

  try {
    await readFile(resolvedPath, "utf8");
  } catch {
    await writeFile(resolvedPath, JSON.stringify({ snapshots: [] }, null, 2) + "\n", "utf8");
  }

  return resolvedPath;
}

export async function readSnapshotStore(filePath) {
  const resolvedPath = await ensureSnapshotFile(filePath);
  const fileContents = await readFile(resolvedPath, "utf8");
  const parsed = JSON.parse(fileContents);

  return {
    snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
  };
}

export async function writeSnapshotStore(store, filePath) {
  const resolvedPath = await ensureSnapshotFile(filePath);
  const tempFilePath = `${resolvedPath}.tmp`;
  const payload = JSON.stringify(store, null, 2) + "\n";

  await writeFile(tempFilePath, payload, "utf8");
  await rename(tempFilePath, resolvedPath);
}
