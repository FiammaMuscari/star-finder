export const TRENDING_COLLECTION_CONFIG = {
  maxTrackedRepos: 100,
  trackedRepoQuota: 70,
  discoveryRepoQuota: 30,
  trackedRepoWindowDays: 60,
  snapshotRetentionDays: 90,
  recentCreatedWindowDays: 30,
  recentlyPushedWindowDays: 30,
  maxDiscoveryResultsPerQuery: 10,
  baseDiscoveryQueries: [
    {
      name: "recent-popular",
      buildQuery({ createdAfter }) {
        return `created:>${createdAfter} stars:>20 archived:false mirror:false`;
      },
    },
    {
      name: "established-active",
      buildQuery({ pushedAfter }) {
        return `pushed:>${pushedAfter} stars:>200 archived:false mirror:false`;
      },
    },
  ],
  languageDiscoveryQueries: [
    {
      name: "recent-typescript",
      buildQuery({ createdAfter }) {
        return `language:TypeScript created:>${createdAfter} stars:>10 archived:false mirror:false`;
      },
    },
    {
      name: "recent-javascript",
      buildQuery({ createdAfter }) {
        return `language:JavaScript created:>${createdAfter} stars:>10 archived:false mirror:false`;
      },
    },
    {
      name: "recent-python",
      buildQuery({ createdAfter }) {
        return `language:Python created:>${createdAfter} stars:>10 archived:false mirror:false`;
      },
    },
    {
      name: "recent-java",
      buildQuery({ createdAfter }) {
        return `language:Java created:>${createdAfter} stars:>10 archived:false mirror:false`;
      },
    },
    {
      name: "recent-go",
      buildQuery({ createdAfter }) {
        return `language:Go created:>${createdAfter} stars:>8 archived:false mirror:false`;
      },
    },
    {
      name: "recent-rust",
      buildQuery({ createdAfter }) {
        return `language:Rust created:>${createdAfter} stars:>8 archived:false mirror:false`;
      },
    },
    {
      name: "recent-cpp",
      buildQuery({ createdAfter }) {
        return `language:C++ created:>${createdAfter} stars:>8 archived:false mirror:false`;
      },
    },
    {
      name: "recent-csharp",
      buildQuery({ createdAfter }) {
        return `language:C# created:>${createdAfter} stars:>8 archived:false mirror:false`;
      },
    },
    {
      name: "recent-php",
      buildQuery({ createdAfter }) {
        return `language:PHP created:>${createdAfter} stars:>8 archived:false mirror:false`;
      },
    },
    {
      name: "recent-ruby",
      buildQuery({ createdAfter }) {
        return `language:Ruby created:>${createdAfter} stars:>8 archived:false mirror:false`;
      },
    },
  ],
};

export function getDiscoveryQueriesForDate(now = new Date()) {
  return [
    ...TRENDING_COLLECTION_CONFIG.baseDiscoveryQueries,
    ...TRENDING_COLLECTION_CONFIG.languageDiscoveryQueries,
  ];
}
