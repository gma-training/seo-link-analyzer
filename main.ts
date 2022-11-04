#!/usr/bin/env ts-node

import { basename } from "node:path";

import { crawlPage, LinkCount } from "./crawl";

function usage() {
  const base = basename(process.argv[1]);
  console.error(`Usage: node ${base} <base-url>`);
  process.exit(1);
}

function onError(message: string) {
  console.error(`Skipping ${message}`);
}

function printReport(pages: LinkCount) {
  const results = Array.from(pages.entries()).sort((a, b) =>
    a[1] > b[1] ? 1 : -1
  );

  for (const [link, count] of results) {
    const countColumn = Number(count).toString().padStart(8);
    console.log(`${countColumn} ${link}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  args.length === 1 || usage();
  const url = args[0];

  const pages: LinkCount = await crawlPage(url, url, { onError });

  printReport(pages);
}

main();
