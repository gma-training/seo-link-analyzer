const { JSDOM } = require("jsdom");

async function crawlPage(url) {
  const response = await fetch(url);
  return await response.text();
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
