const { JSDOM } = require("jsdom");

async function crawlPage(url, { onError = () => {} } = {}) {
  let response;
  try {
    response = await fetch(url);
  } catch (e) {
    onError(url, e.message);
    return;
  }
  if (response.status !== 200) {
    onError(`${url}: ${response.status} ${response.statusText}`);
  } else if (!response.headers.get("Content-Type").includes("text/html")) {
    onError(`${url}: ${response.headers.get("Content-Type")}`);
  } else {
    return await response.text();
  }
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
