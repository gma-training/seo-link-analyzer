const { describe, test, expect } = require("@jest/globals");
const { crawlPage, getURLsFromHTML, normalizeURL } = require("./crawl");

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

describe("crawlPage", () => {
  test("retrieves page and returns HTML body", async () => {
    const pageContent = "<html><body>Hello</body></html>";
    global.fetch = jest.fn(() => {
      return Promise.resolve({
        headers: { get: () => `text/html; charset=utf-8` },
        status: 200,
        text: () => Promise.resolve(pageContent),
      });
    });
    const url = "https://blog.boot.dev/";

    expect(await crawlPage(url, url)).toBe(pageContent);
  });

  test("calls onError when page not found", async () => {
    const status = 404;
    const statusText = "Not Found";
    global.fetch = jest.fn(() => Promise.resolve({ status, statusText }));
    const url = "https://blog.boot.dev/";
    const onError = jest.fn(() => {});

    await crawlPage(url, url, { onError });

    expect(onError).toHaveBeenCalledWith(`${url}: ${status} ${statusText}`);
  });

  test("calls onError when content isn't HTML", async () => {
    const mimeType = "application/pdf; charset=utf-8";
    global.fetch = jest.fn(() => {
      return Promise.resolve({
        headers: { get: () => mimeType },
        status: 200,
        text: () => Promise.resolve("PDF data"),
      });
    });
    const baseUrl = "https://blog.boot.dev/";
    const pdfUrl = "https://blog.boot.dev/path";
    const onError = jest.fn(() => {});

    await crawlPage(baseUrl, pdfUrl, { onError });

    expect(onError).toHaveBeenCalledWith(`${pdfUrl}: ${mimeType}`);
  });

  test("catches network errors", async () => {
    const message = "Some network error";
    global.fetch = jest.fn(() => Promise.reject(Error(message)));
    const url = "https://nosuchsite";
    const onError = jest.fn(() => {});

    await crawlPage(url, url, { onError });

    expect(onError).toHaveBeenCalledWith(`${url}: ${message}`);
  });
});
