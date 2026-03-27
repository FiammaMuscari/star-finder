import {
  buildTrendingComparisons,
  normalizePeriod,
} from "../server/trending.js";
import {
  readSnapshotStore,
  resolveSnapshotFilePath,
} from "../server/trending-snapshots.js";

function readOption(name) {
  const arg = process.argv.find((value) => value.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : null;
}

function printPeriod(snapshotStore, period) {
  const { days, comparisons } = buildTrendingComparisons(snapshotStore, period);
  const readyComparisons = comparisons.filter((comparison) => comparison.available);
  const pendingComparisons = comparisons.filter((comparison) => !comparison.available);

  console.log(`\nPeriod: ${period} (${days}d)`);
  console.log(`Ready items: ${readyComparisons.length}`);

  readyComparisons.forEach((comparison, index) => {
    console.log(
      `${index + 1}. ${comparison.repo_full_name} latest=${comparison.latest.stars} @ ${comparison.latest.captured_at} baseline=${comparison.baseline?.stars} @ ${comparison.baseline?.captured_at} growth=+${comparison.growth}`
    );
  });

  if (pendingComparisons.length > 0) {
    console.log("Unavailable:");
    pendingComparisons.forEach((comparison) => {
      console.log(
        `- ${comparison.repo_full_name} latest=${comparison.latest.captured_at} missing snapshot on or before ${comparison.required_captured_at}`
      );
    });
  }
}

async function main() {
  const requestedFile = readOption("file");
  const requestedPeriod = readOption("period");
  const filePath = resolveSnapshotFilePath(requestedFile);
  const snapshotStore = await readSnapshotStore(filePath);
  const repoNames = new Set(snapshotStore.snapshots.map((snapshot) => snapshot.repo_full_name));

  console.log(`Snapshot file: ${filePath}`);
  console.log(`Total snapshots: ${snapshotStore.snapshots.length}`);
  console.log(`Tracked repositories: ${repoNames.size}`);

  if (requestedPeriod && requestedPeriod !== "all") {
    printPeriod(snapshotStore, normalizePeriod(requestedPeriod));
    return;
  }

  ["today", "week", "month"].forEach((period) => {
    printPeriod(snapshotStore, period);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
