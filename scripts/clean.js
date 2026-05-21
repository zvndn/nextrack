// scripts/clean.js
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EXTS = [".ts", ".tsx", ".js", ".jsx"];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "dist", "out"].includes(entry.name))
        continue;
      walk(fullPath);
    } else if (EXTS.includes(path.extname(entry.name))) {
      let content = fs.readFileSync(fullPath, "utf8");
      const original = content;
      // remove console statements (log, warn, error, info, debug)
      content = content.replace(
        /\bconsole\.(log|warn|error|info|debug)\s*\([^;]*\);?/gm,
        "",
      );
      // replace unknown with unknown (word boundary)
      content = content.replace(/\bany\b/g, "unknown");
      // replace @ts-ignore with @ts-expect-error
      content = content.replace(/\/\/\s*@ts-ignore/g, "// @ts-expect-error");
      // collapse multiple blank lines
      content = content.replace(/\n{3,}/g, "\n\n");
      if (content !== original) {
        fs.writeFileSync(fullPath, content, "utf8");
      }
    }
  }
}

walk(ROOT);
