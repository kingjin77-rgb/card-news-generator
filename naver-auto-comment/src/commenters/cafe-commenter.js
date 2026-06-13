import { generateComment } from '../ai/comment-generator.js';
import { hasCommented, markCommented } from '../db/tracker.js';
import { randomDelay } from '../auth/naver-login.js';
import logger from '../utils/logger.js';

const TYPING_DELAY = () => Math.floor(Math.random() * 70) + 80;

export async function commentOnCafe(context, target, dryRun = false) {
  const { url, keyword } = target;

  if (hasCommented(url)) {
    logger.info(`[카페] 이미 댓글 작성됨: ${url}`);
    return { skipped: true };
  }

  const page = await context.newPage();

  try {
    logger.info(`[카페] 접속 중: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const title = await extractTitle(page);
    const content = await extractCafeContent(page);

    logger.info(`[카페] 제목: ${title?.slice(0, 50)}`);

    const comment = await generateComment({ title, content, keyword, type: 'cafe' });
    logger.info(`[카페] 생성된 댓글: ${comment}`);

    if (dryRun) {
      logger.info('[DRY-RUN] 실제 게시 건너뜀');
      return { success: true, comment, dryRun: true };
    }

    await postCafeComment(page, comment);
    markCommented(url, comment, 'cafe');
    logger.info(`[카페] 댓글 등록 완료: ${url}`);
    return { success: true, comment };
  } catch (err) {
    logger.error(`[카페] 오류 발생 (${url}): ${err.message}`);
    return { success: false, error: err.message };
  } finally {
    await page.close();
  }
}

async function extractTitle(page) {
  const selectors = [
    '.title-box .title',
    'h3.title',
    '.ArticleTitle',
    '.article_header h3',
    'title',
  ];
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el) return (await el.textContent()).trim();
    } catch {}
  }
  return await page.title();
}

async function extractCafeContent(page) {
  const contentFrame = page.frameLocator('iframe#cafe_main');

  const selectors = [
    'div.se-main-container',
    'div.article-viewer',
    'div#tbody',
    'div.ContentRenderer',
  ];

  for (const sel of selectors) {
    try {
      const el = await contentFrame.locator(sel).first();
      if (await el.count() > 0) {
        return (await el.textContent()).slice(0, 800).trim();
      }
    } catch {}
  }

  try {
    return (await page.locator('body').textContent()).slice(0, 800).trim();
  } catch {
    return '';
  }
}

async function postCafeComment(page, comment) {
  const mainFrame = page.frameLocator('iframe#cafe_main');

  const commentSelectors = [
    'textarea.comment_box',
    'textarea[placeholder*="댓글"]',
    'div.CommentBox textarea',
    '#comment',
  ];

  let textarea = null;
  for (const sel of commentSelectors) {
    try {
      const el = mainFrame.locator(sel).first();
      if (await el.count() > 0) {
        textarea = el;
        break;
      }
    } catch {}
  }

  if (!textarea) throw new Error('댓글 입력 영역을 찾을 수 없음');

  await textarea.click();
  await randomDelay(500, 1000);
  await textarea.type(comment, { delay: TYPING_DELAY() });
  await randomDelay(800, 1500);

  const submitSelectors = [
    'button.btn_register',
    'button[type="submit"]',
    'a.btn_comment',
    '.comment_write button',
  ];

  for (const sel of submitSelectors) {
    try {
      const btn = mainFrame.locator(sel).first();
      if (await btn.count() > 0) {
        await btn.click();
        await randomDelay(1000, 2000);
        return;
      }
    } catch {}
  }

  throw new Error('댓글 등록 버튼을 찾을 수 없음');
}
