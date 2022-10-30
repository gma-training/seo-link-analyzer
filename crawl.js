function withoutTrailingSlash(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function normalizeURL(url) {
  const scheme = new RegExp("^https?://");
  return withoutTrailingSlash(url).toLowerCase().replace(scheme, "");
}

module.exports = {
  normalizeURL,
};
