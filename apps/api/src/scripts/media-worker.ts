import dotenv from 'dotenv';
import { logger } from '../core/logging/logger';
import { startMediaProcessingWorker } from '../modules/media/media.queue';
import {
  ensureMediaCleanupSchedule,
  startMediaCleanupWorker,
} from '../modules/media/media.cleanup.queue';
import { connectDB } from '../config/db';

dotenv.config();

const startWorkers = async () => {
  await connectDB();
  startMediaProcessingWorker();
  startMediaCleanupWorker();
  await ensureMediaCleanupSchedule();
  logger.info('Media worker started (processing + orphan cleanup)');
};

startWorkers().catch((error) => {
  logger.error('Media worker failed to start', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
