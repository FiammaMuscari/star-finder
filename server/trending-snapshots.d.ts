export type RepoStarSnapshot = {
  repo_full_name: string;
  stars: number;
  captured_at: string;
};

export type SnapshotStore = {
  snapshots: RepoStarSnapshot[];
};

export const DEFAULT_SNAPSHOT_FILE_PATH: string;

export function resolveSnapshotFilePath(filePath?: string): string;

export function readSnapshotStore(filePath?: string): Promise<SnapshotStore>;

export function writeSnapshotStore(
  store: SnapshotStore,
  filePath?: string
): Promise<void>;
