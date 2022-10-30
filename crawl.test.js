const { describe, test, expect } = require("@jest/globals");
const { normalizeURL } = require("./crawl");

const normalized = "wagslane.dev/path";

describe("normalizeURL", () => {
  test("strips https scheme from URL", () => {
    expect(normalizeURL("https://wagslane.dev/path")).toBe(normalized);
  });

  test("strips http scheme from URL", () => {
    expect(normalizeURL("http://wagslane.dev/path")).toBe(normalized);
  });

  test("converts input to lower case", () => {
    expect(normalizeURL("https://wagsLane.Dev/path")).toBe(normalized);
  });

  test("removes a trailing slash", () => {
    expect(normalizeURL("https://wagslane.dev/path/")).toBe(normalized);
  });
});
