const path = require("node:path");

const { crawlPage } = require("./crawl");

function usage() {
  const basename = path.basename(process.argv[1]);
  console.error(`Usage: node ${basename} <base-url>`);
  process.exit(1);
}

function onError(message) {
  console.error(`Skipping ${message}`);
}

function printReport(pages) {
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

  pages = await crawlPage(url, url, { onError });

  printReport(pages);
}

main();
