import { describe, test, expect, vi } from "vitest";
import { crawlPage, getURLsFromHTML, normalizeURL } from "./crawl";

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

describe("getURLsFromHTML", () => {
  test("link tag URLs are returned", () => {
    const url1 = "https://blog.boot.dev/";
    const url2 = "https://blog.boot.dev/path/to/page";
    const html = `
<html>
  <body>
    <a href="${url1}"><span>Go to Boot.dev</span></a>
    <a href="${url2}"><span>Go to a page</span></a>
  </body>
</html>`.trim();

    const urls = getURLsFromHTML(html, "https://blog.boot.dev/");

    expect(urls).toContain(url1);
    expect(urls).toContain(url2);
  });

  test("relative links are converted to absolute", () => {
    const baseUrl = "https://blog.boot.dev/";
    const path = "/path/to/page";
    const html = `
<html>
  <body>
    <a href="${path}"><span>Go to Boot.dev</span></a>
  </body>
</html>`.trim();

    const urls = getURLsFromHTML(html, baseUrl);

    const absoluteUrl = new URL(path, baseUrl).href;
    expect(urls).toContain(absoluteUrl);
  });
});

function htmlWithNoLinks(): string {
  return `
<html>
  <body>
    <p>No links on this page</p>
  </body>
</html>`.trim();
}

function htmlLinkingTo(...urls: string[]): string {
  return `
<html>
  <body>
    ${urls.map((url) => `<a href="${url}">Link</a>`)}
  </body>
</html>`.trim();
}

interface PageResponses {
  [url: string]: string;
}

function respondWith(data: string, contentType: string): Promise<Response> {
  const response = new Response(data, { status: 200 });
  response.headers.set("Content-Type", contentType);
  return Promise.resolve(response);
}

function fetchReturns(responses: PageResponses) {
  global.fetch = vi.fn((url) => {
    return respondWith(responses[url.toString()], "text/html; charset=utf-8");
  });
}

describe("crawlPage", () => {
  test("retrieves page and returns map of link counts", async () => {
    const baseUrl = "https://blog.boot.dev";
    const url = baseUrl + "/path";
    fetchReturns({ [baseUrl]: htmlLinkingTo(url), [url]: htmlWithNoLinks() });

    const pages = await crawlPage(baseUrl, baseUrl);

    expect(pages.size).toBe(1);
    expect(pages.get(normalizeURL(url))).toEqual(1);
  });

  test("doesn't retrieve links to other domains", async () => {
    const baseUrl = "https://blog.boot.dev/";
    fetchReturns({ [baseUrl]: htmlLinkingTo("https://other.domain/") });

    const pages = await crawlPage(baseUrl, baseUrl);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(pages.size).toBe(0);
  });

  test("counts links on linked pages on same domain", async () => {
    const baseUrl = "https://blog.boot.dev";
    const page1 = "/path1";
    const page2 = "/path2";
    fetchReturns({
      [baseUrl]: htmlLinkingTo(page1),
      [baseUrl + page1]: htmlLinkingTo(page2),
      [baseUrl + page2]: htmlWithNoLinks(),
    });

    const pages = await crawlPage(baseUrl, baseUrl);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(pages.has(normalizeURL(baseUrl + page2))).toBe(true);
  });

  test("only visits each page once", async () => {
    const baseUrl = "https://blog.boot.dev";
    const page1 = "/path1";
    const page2 = "/path2";
    fetchReturns({
      [baseUrl]: htmlLinkingTo(page1),
      [baseUrl + page1]: htmlLinkingTo(page2),
      [baseUrl + page2]: htmlLinkingTo(page1),
    });

    const pages = await crawlPage(baseUrl, baseUrl);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(pages.get(normalizeURL(baseUrl + page1))).toBe(2);
    expect(pages.get(normalizeURL(baseUrl + page2))).toBe(1);
  });

  test("calls onError when page not found", async () => {
    const status = 404;
    const statusText = "Not Found";
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response("Not Found", { status, statusText }))
    );
    const url = "https://blog.boot.dev/";
    const onError = vi.fn(() => {});

    await crawlPage(url, url, { onError });

    expect(onError).toHaveBeenCalledWith(`${url}: ${status} ${statusText}`);
  });

  test("returns map of link counts on error", async () => {
    const status = 404;
    const statusText = "Not Found";
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response("Not Found", { status, statusText }))
    );

    const pages = await crawlPage("https://boot.dev", "https://boot.dev");

    expect(pages.size).toBe(0);
  });

  test("calls onError when content isn't HTML", async () => {
    const mimeType = "application/pdf; charset=utf-8";
    global.fetch = vi.fn(() => respondWith("PDF data", mimeType));
    const baseUrl = "https://blog.boot.dev/";
    const pdfUrl = "https://blog.boot.dev/path";
    const onError = vi.fn(() => {});

    await crawlPage(baseUrl, pdfUrl, { onError });

    expect(onError).toHaveBeenCalledWith(`${pdfUrl}: ${mimeType}`);
  });

  test("catches network errors", async () => {
    const message = "Some network error";
    global.fetch = vi.fn(() => Promise.reject(Error(message)));
    const url = "https://nosuchsite";
    const onError = vi.fn(() => {});

    await crawlPage(url, url, { onError });

    expect(onError).toHaveBeenCalledWith(`${url}: ${message}`);
  });
});
