export const TRENDING_COLLECTION_CONFIG = {
  maxTrackedRepos: 140,
  trackedRepoQuota: 50,
  discoveryRepoQuota: 90,
  minimumLanguageCandidates: 10,
  trackedRepoWindowDays: 30,
  snapshotRetentionDays: 90,
  recentCreatedWindowDays: 14,
  recentlyPushedWindowDays: 7,
  maxDiscoveryResultsPerQuery: 15,
  baseDiscoveryQueries: [
    {
      name: "recent-popular",
      sortBy: "stars",
      buildQuery({ createdAfter }) {
        return `created:>${createdAfter} stars:>20 archived:false mirror:false`;
      },
    },
    {
      name: "active-rising",
      sortBy: "updated",
      buildQuery({ pushedAfter }) {
        return `pushed:>${pushedAfter} stars:20..5000 archived:false mirror:false`;
      },
    },
    {
      name: "active-established",
      sortBy: "updated",
      buildQuery({ pushedAfter }) {
        return `pushed:>${pushedAfter} stars:>5000 archived:false mirror:false`;
      },
    },
  ],
  languageDiscoveryQueries: [
    {
      name: "active-typescript",
      language: "TypeScript",
      sortBy: "updated",
      buildQuery({ pushedAfter }) {
        return `language:TypeScript pushed:>${pushedAfter} stars:>15 archived:false mirror:false`;
      },
    },
    {
      name: "active-javascript",
      language: "JavaScript",
      sortBy: "updated",
      buildQuery({ pushedAfter }) {
        return `language:JavaScript pushed:>${pushedAfter} stars:>15 archived:false mirror:false`;
      },
    },
    {
      name: "active-python",
      language: "Python",
      sortBy: "updated",
      buildQuery({ pushedAfter }) {
        return `language:Python pushed:>${pushedAfter} stars:>15 archived:false mirror:false`;
      },
    },
    {
      name: "active-java",
      language: "Java",
      sortBy: "updated",
      buildQuery({ pushedAfter }) {
        return `language:Java pushed:>${pushedAfter} stars:>12 archived:false mirror:false`;
      },
    },
    {
      name: "active-go",
      language: "Go",
      sortBy: "updated",
      buildQuery({ pushedAfter }) {
        return `language:Go pushed:>${pushedAfter} stars:>10 archived:false mirror:false`;
      },
    },
    {
      name: "active-rust",
      language: "Rust",
      sortBy: "updated",
      buildQuery({ pushedAfter }) {
        return `language:Rust pushed:>${pushedAfter} stars:>10 archived:false mirror:false`;
      },
    },
    {
      name: "active-cpp",
      language: "C++",
      sortBy: "updated",
      buildQuery({ pushedAfter }) {
        return `language:C++ pushed:>${pushedAfter} stars:>8 archived:false mirror:false`;
      },
    },
    {
      name: "active-csharp",
      language: "C#",
      sortBy: "updated",
      buildQuery({ pushedAfter }) {
        return `language:C# pushed:>${pushedAfter} stars:>8 archived:false mirror:false`;
      },
    },
    {
      name: "active-php",
      language: "PHP",
      sortBy: "updated",
      buildQuery({ pushedAfter }) {
        return `language:PHP pushed:>${pushedAfter} stars:>8 archived:false mirror:false`;
      },
    },
    {
      name: "active-ruby",
      language: "Ruby",
      sortBy: "updated",
      buildQuery({ pushedAfter }) {
        return `language:Ruby pushed:>${pushedAfter} stars:>8 archived:false mirror:false`;
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
