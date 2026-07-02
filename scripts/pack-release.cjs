const fs = require("fs");
const path = require("path");

const manifest = require("../manifest.json");
const version = manifest.version;

if (!version) {
  throw new Error("manifest.json の version が見つかりません。");
}

const root = path.resolve(__dirname, "..");
const releaseDir = path.join(root, "release", version);

const files = ["main.js", "manifest.json", "styles.css"];

fs.mkdirSync(releaseDir, { recursive: true });

for (const file of files) {
  const src = path.join(root, file);
  const dest = path.join(releaseDir, file);

  if (!fs.existsSync(src)) {
    throw new Error(`Missing required release file: ${file}`);
  }

  fs.copyFileSync(src, dest);
}

console.log(`Packed Obsidian release files to release/${version}/`);
