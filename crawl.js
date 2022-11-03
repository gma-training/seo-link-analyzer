const { JSDOM } = require("jsdom");

function linkingToSameDomain(url1, url2) {
  return new URL(url1).host === new URL(url2).host;
}

function incrementCount(pages, url) {
  return (pages.get(normalizeURL(url)) || 0) + 1;
}

async function fetchPage(url) {
  const response = await fetch(url);
  if (response.status !== 200) {
    throw Error(`${response.status} ${response.statusText}`);
  } else if (!response.headers.get("Content-Type").includes("text/html")) {
    throw Error(`${response.headers.get("Content-Type")}`);
  }
  return await response.text();
}

async function crawlPage(
  baseUrl,
  currentUrl,
  { pages = new Map(), onError = () => {} } = {}
) {
  let html;
  try {
    html = await fetchPage(currentUrl);
  } catch (e) {
    onError(`${currentUrl}: ${e.message}`);
    return pages;
  }
  for (const url of getURLsFromHTML(html, baseUrl)) {
    if (linkingToSameDomain(baseUrl, url)) {
      const seenPageBefore = pages.has(normalizeURL(url));
      pages.set(normalizeURL(url), incrementCount(pages, url));
      if (!seenPageBefore) {
        pages = await crawlPage(baseUrl, url, { pages, onError });
      }
    }
  }
  return pages;
}

function withoutTrailingSlash(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function normalizeURL(string) {
  const url = new URL(string);
  return url.host + withoutTrailingSlash(url.pathname);
}

function absoluteUrl(url, baseUrl) {
  return new URL(url, baseUrl).href;
}

function getURLsFromHTML(htmlBody, baseURL) {
  const dom = new JSDOM(htmlBody);
  const nodes = dom.window.document.querySelectorAll("a");
  return Array.from(nodes, (element) => absoluteUrl(element.href, baseURL));
}

module.exports = {
  crawlPage,
  normalizeURL,
  getURLsFromHTML,
};
