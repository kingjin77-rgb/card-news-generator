import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIES_PATH = path.join(__dirname, '../../logs/cookies.json');

const TYPING_DELAY = () => Math.floor(Math.random() * 70) + 80; // 80~150ms

export async function createBrowser() {
  return chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
    ],
  });
}

export async function getLoggedInContext(browser) {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });

  if (fs.existsSync(COOKIES_PATH)) {
    try {
      const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
      await context.addCookies(cookies);
      logger.info('저장된 쿠키로 세션 복원');

      const page = await context.newPage();
      await page.goto('https://www.naver.com', { waitUntil: 'domcontentloaded' });
      const isLoggedIn = await page.$('a.MyView-module__link___HpHMW') !== null ||
                         await page.$('#gnb_login_button') === null;
      await page.close();

      if (isLoggedIn) {
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

async function doLogin(context) {
  const page = await context.newPage();

  try {
    await page.goto('https://nid.naver.com/nidlogin.login', { waitUntil: 'networkidle' });

    await page.waitForSelector('#id', { timeout: 10000 });
    await page.click('#id');
    await page.type('#id', process.env.NAVER_ID, { delay: TYPING_DELAY() });

    await randomDelay(300, 700);

    await page.click('#pw');
    await page.type('#pw', process.env.NAVER_PW, { delay: TYPING_DELAY() });

    await randomDelay(500, 1000);

    await page.click('.btn_login');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });

    const currentUrl = page.url();

    if (currentUrl.includes('captcha') || currentUrl.includes('protect')) {
      logger.error('CAPTCHA 또는 보안 검증 화면 감지. 수동 개입이 필요합니다.');
      logger.error(`현재 URL: ${currentUrl}`);
      throw new Error('CAPTCHA_REQUIRED');
    }

    if (currentUrl.includes('nidlogin')) {
      logger.error('로그인 실패 - ID/PW를 확인하세요');
      throw new Error('LOGIN_FAILED');
    }

    const cookies = await context.cookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    logger.info('로그인 성공 - 쿠키 저장 완료');
  } finally {
    await page.close();
  }
}

export function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
