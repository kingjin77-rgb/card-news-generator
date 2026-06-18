import 'dotenv/config';
import { createBrowser, getLoggedInContext, randomDelay } from './src/auth/naver-login.js';
import { commentOnCafe } from './src/commenters/cafe-commenter.js';
import { commentOnBlog } from './src/commenters/blog-commenter.js';
import { getDailyCount, getStats, getHistory } from './src/db/tracker.js';
import logger from './src/utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGETS_PATH = path.join(__dirname, 'config/targets.json');

function loadTargets() {
  if (!fs.existsSync(TARGETS_PATH)) {
    logger.warn(`targets.json 없음. ${TARGETS_PATH}.example 을 복사하여 편집하세요.`);
    return [];
  }
  return JSON.parse(fs.readFileSync(TARGETS_PATH, 'utf-8')).filter((t) => t.enabled !== false);
}

function getIntervalMs() {
  const min = parseInt(process.env.COMMENT_INTERVAL_MIN || '30') * 60 * 1000;
  const max = parseInt(process.env.COMMENT_INTERVAL_MAX || '90') * 60 * 1000;
  return Math.floor(Math.random() * (max - min)) + min;
}

export async function runCommentSession({ dryRun = false } = {}) {
  const dailyLimit = parseInt(process.env.DAILY_LIMIT || '20');
  const currentCount = getDailyCount();

  if (currentCount >= dailyLimit) {
    logger.info(`오늘 댓글 한도(${dailyLimit}개) 초과 - 내일 다시 실행됩니다.`);
    return;
  }

  const targets = loadTargets();
  if (!targets.length) {
    logger.warn('처리할 대상 URL이 없습니다. config/targets.json 을 설정하세요.');
    return;
  }

  const remaining = dailyLimit - currentCount;
  const toProcess = targets.slice(0, remaining);

  logger.info(`오늘 이미 작성: ${currentCount}개 / 한도: ${dailyLimit}개 / 처리 예정: ${toProcess.length}개`);

  const browser = await createBrowser();
  let context;

  try {
    context = await getLoggedInContext(browser);

    for (let i = 0; i < toProcess.length; i++) {
      const target = toProcess[i];
      logger.info(`[${i + 1}/${toProcess.length}] 처리 중: ${target.url}`);

      let result;
      if (target.type === 'cafe') {
        result = await commentOnCafe(context, target, dryRun);
      } else if (target.type === 'blog') {
        result = await commentOnBlog(context, target, dryRun);
      } else {
        logger.warn(`알 수 없는 타입: ${target.type}`);
        continue;
      }

      if (result.success && !result.dryRun && i < toProcess.length - 1) {
        const waitMs = getIntervalMs();
        logger.info(`다음 댓글까지 ${Math.round(waitMs / 60000)}분 대기...`);
        await randomDelay(waitMs, waitMs + 5000);
      }
    }
  } finally {
    if (context) await context.close();
    await browser.close();
  }
}

async function addTarget(url) {
  if (!url) {
    logger.error('URL을 입력하세요: node index.js add <url>');
    process.exit(1);
  }

  const type = url.includes('cafe.naver.com') ? 'cafe' : 'blog';
  const targets = fs.existsSync(TARGETS_PATH)
    ? JSON.parse(fs.readFileSync(TARGETS_PATH, 'utf-8'))
    : [];

  if (targets.find((t) => t.url === url)) {
    logger.warn('이미 등록된 URL입니다.');
    return;
  }

  targets.push({ type, url, keyword: '', enabled: true });
  fs.writeFileSync(TARGETS_PATH, JSON.stringify(targets, null, 2));
  logger.info(`추가 완료 (${type}): ${url}`);
  logger.info('config/targets.json 에서 keyword 를 설정하면 더 자연스러운 댓글이 생성됩니다.');
}

async function showStatus() {
  const stats = getStats();
  console.log('\n=== 댓글 자동화 현황 ===');
  console.log(`총 작성된 댓글: ${stats.total}개`);
  console.log(`오늘 작성: ${stats.today}개 / 한도: ${process.env.DAILY_LIMIT || 20}개`);
  console.log('\n플랫폼별:');
  stats.byType.forEach((r) => console.log(`  ${r.type}: ${r.cnt}개`));

  const history = getHistory(10);
  if (history.length) {
    console.log('\n최근 댓글 10개:');
    history.forEach((h) => {
      console.log(`  [${h.commented_at}] [${h.type}] ${h.url.slice(0, 60)}...`);
      console.log(`    → ${h.comment?.slice(0, 80)}`);
    });
  }
}

// CLI 진입점
const [, , command, ...args] = process.argv;

if (command === 'run') {
  const dryRun = args.includes('--dry-run');
  if (dryRun) logger.info('=== DRY-RUN 모드: 실제 댓글 게시 안 함 ===');
  runCommentSession({ dryRun }).catch((err) => {
    logger.error(`실행 오류: ${err.message}`);
    process.exit(1);
  });
} else if (command === 'schedule') {
  const { startScheduler } = await import('./src/scheduler/scheduler.js');
  startScheduler();
} else if (command === 'status') {
  showStatus();
} else if (command === 'add') {
  addTarget(args[0]);
} else {
  console.log(`
네이버 자동 댓글 시스템

사용법:
  node index.js run              # 즉시 1회 실행
  node index.js run --dry-run    # 테스트 (실제 게시 안 함)
  node index.js schedule         # 스케줄러 시작
  node index.js status           # 댓글 현황 확인
  node index.js add <url>        # 대상 URL 추가

시작 전 설정:
  1. cp .env.example .env  (NAVER_ID, NAVER_PW, ANTHROPIC_API_KEY 입력)
  2. cp config/targets.json.example config/targets.json  (URL 목록 편집)
  3. npm install
  4. npm run install-browsers
  5. node index.js run --dry-run  (테스트)
`);
}
