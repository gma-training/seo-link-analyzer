const { JSDOM } = require("jsdom");

function countLink(pages, url) {
  const key = normalizeURL(url);
  pages.set(key, (pages.get(key) || 0) + 1);
}

async function crawlPage(
  baseUrl,
  currentUrl,
  { pages = new Map(), onError = () => {} } = {}
) {
  let response;
  try {
    response = await fetch(currentUrl);
  } catch (e) {
    onError(`${currentUrl}: ${e.message}`);
    return pages;
  }
  if (response.status !== 200) {
    onError(`${currentUrl}: ${response.status} ${response.statusText}`);
  } else if (!response.headers.get("Content-Type").includes("text/html")) {
    onError(`${currentUrl}: ${response.headers.get("Content-Type")}`);
  } else {
    const html = await response.text();
    for (const url of getURLsFromHTML(html, baseUrl)) {
      countLink(pages, url);
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
