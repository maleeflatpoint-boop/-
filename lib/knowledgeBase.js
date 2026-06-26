const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

let cached = null;

function loadKnowledgeBase() {
  if (cached) return cached;

  const files = fs.existsSync(UPLOADS_DIR)
    ? fs.readdirSync(UPLOADS_DIR).filter((f) => f.toLowerCase().endsWith('.md'))
    : [];

  const docs = files.map((file) => {
    const content = fs.readFileSync(path.join(UPLOADS_DIR, file), 'utf-8');
    return `### 문서: ${file}\n\n${content}`;
  });

  cached = docs.join('\n\n---\n\n');
  return cached;
}

module.exports = { loadKnowledgeBase };
