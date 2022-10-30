const path = require("node:path");

function usage() {
  const basename = path.basename(process.argv[1]);
  console.error(`Usage: node ${basename} <base-url>`);
  process.exit(1);
}

function main() {
  const args = process.argv.slice(2);
  args.length === 1 || usage();
}

main();
