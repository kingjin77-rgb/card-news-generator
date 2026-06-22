import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../logs/comments.json');

function loadData() {
  if (!fs.existsSync(DB_PATH)) return { posts: [], dailyCounts: {} };
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return { posts: [], dailyCounts: {} };
  }
}

function saveData(data) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function hasCommented(url) {
  const data = loadData();
  return data.posts.some((p) => p.url === url);
}

export function markCommented(url, comment, type) {
  const data = loadData();
  if (data.posts.some((p) => p.url === url)) return;
  data.posts.push({ url, comment, type, commented_at: new Date().toISOString() });
  const today = new Date().toISOString().slice(0, 10);
  data.dailyCounts[today] = (data.dailyCounts[today] || 0) + 1;
  saveData(data);
}

export function getDailyCount() {
  const data = loadData();
  const today = new Date().toISOString().slice(0, 10);
  return data.dailyCounts[today] || 0;
}

export function getHistory(limit = 50) {
  const data = loadData();
  return data.posts
    .sort((a, b) => new Date(b.commented_at) - new Date(a.commented_at))
    .slice(0, limit);
}

export function getStats() {
  const data = loadData();
  const total = data.posts.length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = data.dailyCounts[today] || 0;
  const byType = {};
  data.posts.forEach((p) => {
    byType[p.type] = (byType[p.type] || 0) + 1;
  });
  return {
    total,
    today: todayCount,
    byType: Object.entries(byType).map(([type, cnt]) => ({ type, cnt })),
  };
}
