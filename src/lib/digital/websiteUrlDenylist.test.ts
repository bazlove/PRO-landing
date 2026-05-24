import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isForbiddenGenericWebsiteUrl,
  sanitizePublicWebsiteUrl,
} from "./websiteUrlDenylist.ts";

describe("websiteUrl denylist", () => {
  it("flags generic aggregator roots", () => {
    assert.equal(isForbiddenGenericWebsiteUrl("https://hh.ru/"), true);
    assert.equal(isForbiddenGenericWebsiteUrl("https://www.hh.ru/"), true);
    assert.equal(isForbiddenGenericWebsiteUrl("https://career.habr.com/"), true);
    assert.equal(isForbiddenGenericWebsiteUrl("https://ru.linkedin.com/"), true);
  });

  it("allows company-specific URLs", () => {
    assert.equal(isForbiddenGenericWebsiteUrl("https://example.com/"), false);
    assert.equal(isForbiddenGenericWebsiteUrl("https://hh.ru/employer/12345"), false);
  });

  it("sanitizes forbidden roots to null", () => {
    assert.equal(sanitizePublicWebsiteUrl("https://habr.com/"), null);
    assert.equal(sanitizePublicWebsiteUrl("https://company.example/"), "https://company.example/");
  });
});
