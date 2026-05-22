import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/search/repositories.js";

function createGitHubResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function withMockedFetchAndToken(token, run) {
  const previousFetch = globalThis.fetch;
  const previousToken = process.env.GITHUB_TOKEN;

  if (token === undefined) {
    delete process.env.GITHUB_TOKEN;
  } else {
    process.env.GITHUB_TOKEN = token;
  }

  try {
    await run();
  } finally {
    globalThis.fetch = previousFetch;

    if (previousToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = previousToken;
    }
  }
}

test("search api does not send an Authorization header when GITHUB_TOKEN is missing", async () => {
  await withMockedFetchAndToken(undefined, async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      return createGitHubResponse({ items: [], total_count: 0 });
    };

    const response = await handler({
      url: "https://star-finder-one.vercel.app/api/search/repositories?q=react",
    });

    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.github.com/search/repositories?q=react");
    assert.equal(calls[0].options.headers.Authorization, undefined);
  });
});

test("search api retries without Authorization when GitHub rejects the configured token", async () => {
  await withMockedFetchAndToken("invalid-token", async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });

      if (calls.length === 1) {
        return createGitHubResponse({ message: "Bad credentials" }, 401);
      }

      return createGitHubResponse({ items: [], total_count: 0 });
    };

    const response = await handler({
      url: "https://star-finder-one.vercel.app/api/search/repositories?q=react",
    });

    assert.equal(response.status, 200);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].options.headers.Authorization, "Bearer invalid-token");
    assert.equal(calls[1].options.headers.Authorization, undefined);
  });
});
