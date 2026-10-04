import assert from "node:assert/strict";
import test from "node:test";
import { buildWebOrderRedirectMessage } from "./web-order-redirect";

test("uses the owner message when web-order redirect is customized", () => {
  assert.equal(
    buildWebOrderRedirectMessage({
      webOrderRedirectMessage: "Pedí desde https://orders.example.test",
    }),
    "Pedí desde https://orders.example.test"
  );
});

test("builds the default redirect with the public digital-menu URL", () => {
  const previousAuthUrl = process.env.AUTH_URL;
  process.env.AUTH_URL = "https://muzapp.example.test";

  try {
    const message = buildWebOrderRedirectMessage({});
    assert.match(message, /https:\/\/muzapp\.example\.test\/carta-digital/);
  } finally {
    if (previousAuthUrl === undefined) delete process.env.AUTH_URL;
    else process.env.AUTH_URL = previousAuthUrl;
  }
});

test("keeps a safe fallback when no public deployment URL is configured", () => {
  const previousAuthUrl = process.env.AUTH_URL;
  delete process.env.AUTH_URL;

  try {
    const message = buildWebOrderRedirectMessage({ businessWebsite: "not-a-url" });
    assert.match(message, /Ingresá desde nuestra web/);
  } finally {
    if (previousAuthUrl !== undefined) process.env.AUTH_URL = previousAuthUrl;
  }
});
