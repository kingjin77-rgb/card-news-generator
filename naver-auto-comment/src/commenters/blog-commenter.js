import { generateComment } from '../ai/comment-generator.js';
import { hasCommented, markCommented } from '../db/tracker.js';
import { randomDelay } from '../auth/naver-login.js';
import logger from '../utils/logger.js';

const TYPING_DELAY = () => Math.floor(Math.random() * 70) + 80;

export async function commentOnBlog(context, target, dryRun = false) {
  const { url, keyword } = target;

  if (hasCommented(url)) {
    logger.info(`[블로그] 이미 댓글 작성됨: ${url}`);
    return { skipped: true };
  }

  const page = await context.newPage();

  try {
    logger.info(`[블로그] 접속 중: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const title = await extractBlogTitle(page);
    const content = await extractBlogContent(page);

    logger.info(`[블로그] 제목: ${title?.slice(0, 50)}`);

    const comment = await generateComment({ title, content, keyword, type: 'blog' });
    logger.info(`[블로그] 생성된 댓글: ${comment}`);

    if (dryRun) {
      logger.info('[DRY-RUN] 실제 게시 건너뜀');
      return { success: true, comment, dryRun: true };
    }

    await postBlogComment(page, comment);
    markCommented(url, comment, 'blog');
    logger.info(`[블로그] 댓글 등록 완료: ${url}`);
    return { success: true, comment };
  } catch (err) {
    logger.error(`[블로그] 오류 발생 (${url}): ${err.message}`);
    return { success: false, error: err.message };
  } finally {
    await page.close();
  }
}

async function extractBlogTitle(page) {
  const mainFrame = page.frameLocator('iframe#mainFrame');

  const selectors = [
    '.se-title-text',
    'h2.pcol1',
    '.htitle',
    '.post-title',
  ];

  for (const sel of selectors) {
    try {
      const el = mainFrame.locator(sel).first();
      if (await el.count() > 0) return (await el.textContent()).trim();
    } catch {}
  }

  return await page.title();
}

async function extractBlogContent(page) {
  const mainFrame = page.frameLocator('iframe#mainFrame');

  const selectors = [
    'div.se-main-container',
    'div#postViewArea',
    'div.post-view',
    'div.post_ct',
  ];

  for (const sel of selectors) {
    try {
      const el = mainFrame.locator(sel).first();
      if (await el.count() > 0) {
        return (await el.textContent()).slice(0, 800).trim();
      }
    } catch {}
  }

  return '';
}

async function postBlogComment(page, comment) {
  const mainFrame = page.frameLocator('iframe#mainFrame');

  const commentAreaSelectors = [
    'textarea#naverComment__write_textarea',
    'textarea[placeholder*="댓글"]',
    'textarea.u_cbox_text',
    '#comment_content',
  ];

  let textarea = null;
  for (const sel of commentAreaSelectors) {
    try {
      const el = mainFrame.locator(sel).first();
      if (await el.count() > 0) {
        textarea = el;
        break;
      }
    } catch {}
  }

  // 네이버 댓글 컴포넌트는 별도 iframe을 사용하는 경우도 있음
  if (!textarea) {
    const commentIframe = page.frameLocator('iframe#commentIframe, iframe[title*="댓글"]');
    for (const sel of commentAreaSelectors) {
      try {
        const el = commentIframe.locator(sel).first();
        if (await el.count() > 0) {
          textarea = el;
          break;
        }
      } catch {}
    }
  }

  if (!textarea) throw new Error('댓글 입력 영역을 찾을 수 없음');

  await textarea.click();
  await randomDelay(500, 1000);
  await textarea.type(comment, { delay: TYPING_DELAY() });
  await randomDelay(800, 1500);

  const submitSelectors = [
    'button.u_cbox_btn_upload',
    'button[type="submit"]',
    '.btn_register',
    'button.comment_write_btn',
  ];

  for (const sel of submitSelectors) {
    for (const frame of [mainFrame, page.frameLocator('iframe#commentIframe')]) {
      try {
        const btn = frame.locator(sel).first();
        if (await btn.count() > 0) {
          await btn.click();
          await randomDelay(1000, 2000);
          return;
        }
      } catch {}
    }
  }

  throw new Error('댓글 등록 버튼을 찾을 수 없음');
}
