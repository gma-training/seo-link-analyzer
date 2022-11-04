import { JSDOM } from "jsdom";

export type LinkCount = Map<string, number>;

function linkingToSameDomain(url1: string, url2: string): boolean {
  return new URL(url1).host === new URL(url2).host;
}

function incrementCount(pages: LinkCount, url: string): number {
  return (pages.get(normalizeURL(url)) || 0) + 1;
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url);
  if (response.status !== 200) {
    throw Error(`${response.status} ${response.statusText}`);
  } else if (!response.headers.get("Content-Type")?.includes("text/html")) {
    throw Error(`${response.headers.get("Content-Type")}`);
  }
  return await response.text();
}

export async function crawlPage(
  baseUrl: string,
  currentUrl: string,
  {
    pages = new Map(),
    onError = () => {},
  }: { pages?: LinkCount; onError?: (message: string) => void } = {}
): Promise<LinkCount> {
  let html: string;
  try {
    html = await fetchPage(currentUrl);
  } catch (e) {
    const message = e instanceof Error ? e.message : e;
    onError(`${currentUrl}: ${message}`);
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

function withoutTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function normalizeURL(uri: string): string {
  const url = new URL(uri);
  return url.host + withoutTrailingSlash(url.pathname);
}

function absoluteUrl(url: string, baseUrl: string): string {
  return new URL(url, baseUrl).href;
}

export function getURLsFromHTML(htmlBody: string, baseURL: string): string[] {
  const dom = new JSDOM(htmlBody);
  const nodes = dom.window.document.querySelectorAll("a");
  return Array.from(nodes, (element: HTMLAnchorElement) =>
    absoluteUrl(element.href, baseURL)
  );
}
