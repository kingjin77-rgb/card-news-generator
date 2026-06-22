import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIES_PATH = path.join(__dirname, '../../logs/cookies.json');

export async function createBrowser() {
  const launchOpts = {
    headless: process.env.HEADLESS !== 'false',
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ],
  };
  return chromium.launch(launchOpts);
}

export async function getLoggedInContext(browser) {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    viewport: { width: 1280, height: 900 },
  });

  if (fs.existsSync(COOKIES_PATH)) {
    try {
      const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
      await context.addCookies(cookies);
      logger.info('저장된 쿠키로 세션 복원');

      const page = await context.newPage();
      await page.goto('https://www.naver.com', { waitUntil: 'domcontentloaded' });
      const loginBtn = await page.$('#gnb_login_button');
      await page.close();

      if (!loginBtn) {
        logger.info('기존 세션 유효 - 재로그인 불필요');
        return context;
      }
      logger.info('세션 만료 - 재로그인 필요');
    } catch {
      logger.warn('쿠키 파일 손상 - 재로그인');
    }
  }

  await doLogin(context);
  return context;
}

async function pasteText(page, selector, text) {
  await page.click(selector);
  await page.evaluate(
    ([sel, val]) => {
      const el = document.querySelector(sel);
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    [selector, text]
  );
}

async function doLogin(context) {
  const page = await context.newPage();

  try {
    await page.goto('https://nid.naver.com/nidlogin.login?mode=form&url=https%3A%2F%2Fwww.naver.com', {
      waitUntil: 'networkidle',
    });
    await randomDelay(1000, 2000);

    await page.waitForSelector('#id', { timeout: 10000 });

    await pasteText(page, '#id', process.env.NAVER_ID);
    await randomDelay(300, 600);
    await pasteText(page, '#pw', process.env.NAVER_PW);
    await randomDelay(500, 1000);

    await page.screenshot({ path: path.join(__dirname, '../../logs/login_before_click.png') });

    await page.click('.btn_login, #log\\.login');

    try {
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
    } catch {
      await randomDelay(3000, 5000);
    }

    const currentUrl = page.url();
    await page.screenshot({ path: path.join(__dirname, '../../logs/login_after_click.png') });
    logger.info(`로그인 후 URL: ${currentUrl}`);

    if (currentUrl.includes('captcha') || currentUrl.includes('protect')) {
      logger.error('CAPTCHA 감지 - 브라우저에서 수동으로 풀어주세요');
      logger.info('30초 대기 중... 브라우저에서 CAPTCHA를 풀어주세요');
      await page.waitForNavigation({ timeout: 30000 }).catch(() => {});
    }

    if (currentUrl.includes('nidlogin')) {
      const errorMsg = await page.$eval('.error_message, .err_common', (el) => el.textContent).catch(() => '');
      if (errorMsg) logger.error(`로그인 오류: ${errorMsg}`);

      // CAPTCHA 있는 경우 수동 대기
      const hasCaptcha = await page.$('#captcha, .captcha_box, img[alt*="캡차"]');
      if (hasCaptcha) {
        logger.info('CAPTCHA 감지! 브라우저에서 수동으로 풀고 로그인해주세요 (60초 대기)');
        await page.waitForURL('**/naver.com**', { timeout: 60000 }).catch(() => {});
      } else {
        throw new Error('LOGIN_FAILED');
      }
    }

    const finalUrl = page.url();
    if (finalUrl.includes('naver.com') && !finalUrl.includes('nidlogin')) {
      const cookies = await context.cookies();
      const logsDir = path.join(__dirname, '../../logs');
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
      fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
      logger.info('로그인 성공 - 쿠키 저장 완료');
    } else {
      throw new Error('LOGIN_FAILED');
    }
  } finally {
    await page.close();
  }
}

export function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
