// Project Overview Generation

/**
 * Auto‑generated script to walk the project directory and produce a markdown overview.
 * Run with `node generate_overview.js`.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);

function walk(dir, depth = 0) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let result = '';
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const indent = '  '.repeat(depth);
    if (entry.isDirectory()) {
      result += `${indent}- **${entry.name}/**\n`;
      result += walk(fullPath, depth + 1);
    } else {
      const ext = path.extname(entry.name);
      result += `${indent}- ${entry.name}\n`;
      // For source files, add a brief preview of top comments / exports.
      if (['.js', '.ts', '.tsx', '.jsx', '.md', '.json', '.env'].includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const firstLines = content.split('\n').slice(0, 10).join('\n');
          const preview = firstLines.replace(/`/g, '\\`');
          result += `${indent}  \`\`\`\n${preview}\n${indent}  \`\`\`\n`;
        } catch (_) {}
      }
    }
  }
  return result;
}

const overview = `# Project Overview\n\nGenerated on ${new Date().toISOString()}\n\n## Directory Tree\n\n${walk(ROOT)}\n`;
fs.writeFileSync(path.join(ROOT, 'PROJECT_OVERVIEW.md'), overview);
console.log('PROJECT_OVERVIEW.md generated');
