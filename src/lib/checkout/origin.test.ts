import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedCheckoutOrigin } from "./origin";

test("accepts the browser origin reconstructed by a Render proxy", () => {
  const request = new Request("http://127.0.0.1:3000/api/checkout", {
    headers: {
      origin: "https://muzapp.onrender.com",
      "x-forwarded-host": "muzapp.onrender.com",
      "x-forwarded-proto": "https",
    },
  });
  assert.equal(isAllowedCheckoutOrigin(request), true);
});

test("rejects an origin different from the public proxy host", () => {
  const request = new Request("http://127.0.0.1:3000/api/checkout", {
    headers: {
      origin: "https://attacker.example",
      "x-forwarded-host": "muzapp.onrender.com",
      "x-forwarded-proto": "https",
    },
  });
  assert.equal(isAllowedCheckoutOrigin(request), false);
});
