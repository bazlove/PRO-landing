import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isCanonicalHeadHunterEmployerUrl,
  isRegionalHeadHunterEmployerUrl,
  toCanonicalHeadHunterEmployerUrl,
} from "./normalizeCompany.ts";

describe("HeadHunter employer URL helpers", () => {
  it("canonicalizes main-domain employer URLs", () => {
    assert.equal(
      toCanonicalHeadHunterEmployerUrl("http://hh.ru/employer/12345"),
      "https://hh.ru/employer/12345",
    );
    assert.equal(
      toCanonicalHeadHunterEmployerUrl("https://www.hh.ru/employer/12345/"),
      "https://hh.ru/employer/12345",
    );
    assert.equal(isCanonicalHeadHunterEmployerUrl("https://hh.ru/employer/12345"), true);
  });

  it("detects regional employer URLs", () => {
    for (const url of [
      "https://spb.hh.ru/employer/12345",
      "https://voronezh.hh.ru/employer/12345",
      "https://rostov.hh.ru/employer/12345",
      "https://novosibirsk.hh.ru/employer/12345",
    ]) {
      assert.equal(isRegionalHeadHunterEmployerUrl(url), true);
      assert.equal(
        toCanonicalHeadHunterEmployerUrl(url),
        "https://hh.ru/employer/12345",
      );
      assert.equal(isCanonicalHeadHunterEmployerUrl(url), false);
    }
  });

  it("rejects non-employer HH URLs for canonical JSON contract", () => {
    assert.equal(
      isCanonicalHeadHunterEmployerUrl("https://hh.ru/search/vacancy?employer_id=12345"),
      false,
    );
    assert.equal(isCanonicalHeadHunterEmployerUrl("https://hh.ru/vacancy/12345"), false);
    assert.equal(isCanonicalHeadHunterEmployerUrl("http://hh.ru/employer/12345"), false);
    assert.equal(isCanonicalHeadHunterEmployerUrl(null), true);
  });
});
