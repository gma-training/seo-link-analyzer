function withoutTrailingSlash(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function normalizeURL(string) {
  const url = new URL(string);
  return url.host + withoutTrailingSlash(url.pathname);
}

module.exports = {
  normalizeURL,
};
