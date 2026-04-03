import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchGitHubTrendingResponse,
  parseGitHubTrendingPage,
} from "../server/github-trending.js";

const DAILY_FIXTURE = `
<article class="Box-row">
  <h2 class="h3 lh-condensed">
    <a href="/dmtrKovalenko/fff.nvim">
      <span class="text-normal">
        dmtrKovalenko /
      </span>
      fff.nvim
    </a>
  </h2>
  <p class="col-9 color-fg-muted my-1 tmp-pr-4">
    The fastest and the most accurate file search toolkit for AI agents
  </p>
  <div class="f6 color-fg-muted mt-2">
    <span class="tmp-mr-3 d-inline-block ml-0 tmp-ml-0">
      <span itemprop="programmingLanguage">Rust</span>
    </span>
    <a href="/dmtrKovalenko/fff.nvim/stargazers"><svg></svg>3,194</a>
    <span>767 stars today</span>
  </div>
</article>
<article class="Box-row">
  <h2 class="h3 lh-condensed">
    <a href="/openai/codex">
      <span class="text-normal">
        openai /
      </span>
      codex
    </a>
  </h2>
  <div class="f6 color-fg-muted mt-2">
    <span class="tmp-mr-3 d-inline-block ml-0 tmp-ml-0">
      <span itemprop="programmingLanguage">Rust</span>
    </span>
    <a href="/openai/codex/stargazers"><svg></svg>72,877</a>
    <span>505 stars today</span>
  </div>
</article>
`;

const WEEKLY_FIXTURE = `
<article class="Box-row">
  <h2 class="h3 lh-condensed">
    <a href="/antinomyhq/forgecode">
      <span class="text-normal">antinomyhq /</span>
      forgecode
    </a>
  </h2>
  <div class="f6 color-fg-muted mt-2">
    <span itemprop="programmingLanguage">Rust</span>
    <a href="/antinomyhq/forgecode/stargazers"><svg></svg>5,754</a>
    <span>252 stars this week</span>
  </div>
</article>
`;

test("parser extracts repositories from the GitHub Trending HTML", () => {
  const payload = parseGitHubTrendingPage(
    DAILY_FIXTURE,
    "today",
    10,
    "2026-04-03T12:00:00.000Z"
  );

  assert.equal(payload.ready, true);
  assert.deepEqual(payload.items, [
    {
      repo_full_name: "dmtrKovalenko/fff.nvim",
      stars: 3194,
      growth: 767,
      language: "Rust",
      description: "The fastest and the most accurate file search toolkit for AI agents",
      captured_at: "2026-04-03T12:00:00.000Z",
    },
    {
      repo_full_name: "openai/codex",
      stars: 72877,
      growth: 505,
      language: "Rust",
      description: null,
      captured_at: "2026-04-03T12:00:00.000Z",
    },
  ]);
});

test("fetcher maps today and week requests to the GitHub Trending pages", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return {
      ok: true,
      status: 200,
      async text() {
        return url.includes("since=weekly") ? WEEKLY_FIXTURE : DAILY_FIXTURE;
      },
    };
  };

  const todayPayload = await fetchGitHubTrendingResponse("today", "Rust", {
    fetchImpl,
    now: new Date("2026-04-03T12:00:00.000Z"),
  });
  const weekPayload = await fetchGitHubTrendingResponse("week", "Rust", {
    fetchImpl,
    now: new Date("2026-04-03T12:05:00.000Z"),
  });

  assert.equal(calls[0], "https://github.com/trending/rust?since=daily");
  assert.equal(calls[1], "https://github.com/trending/rust?since=weekly");
  assert.equal(todayPayload.items[0].repo_full_name, "dmtrKovalenko/fff.nvim");
  assert.equal(todayPayload.items[0].growth, 767);
  assert.equal(weekPayload.items[0].repo_full_name, "antinomyhq/forgecode");
  assert.equal(weekPayload.items[0].growth, 252);
});
