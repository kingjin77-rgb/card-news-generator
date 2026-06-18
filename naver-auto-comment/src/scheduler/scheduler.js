import schedule from 'node-schedule';
import { runCommentSession } from '../../index.js';
import logger from '../utils/logger.js';

export function startScheduler() {
  const cronExpr = process.env.SCHEDULE_CRON || '0 9,14,19 * * *';
  logger.info(`스케줄러 시작: ${cronExpr}`);

  schedule.scheduleJob(cronExpr, async () => {
    logger.info('=== 스케줄 실행 시작 ===');
    try {
      await runCommentSession({ dryRun: false });
    } catch (err) {
      logger.error(`스케줄 실행 오류: ${err.message}`);
    }
    logger.info('=== 스케줄 실행 완료 ===');
  });

  logger.info('스케줄러 대기 중... (Ctrl+C 로 종료)');
}
