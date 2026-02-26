import { Queue, Worker } from 'bullmq';
import { logger } from '../../core/logging/logger';
import { cleanupOrphanedMedia } from './media.cleanup';

const redisUrl = process.env.REDIS_URL;
const CLEANUP_QUEUE_NAME = 'media-cleanup';
const CLEANUP_JOB_NAME = 'cleanup-orphaned-media' as const;

type CleanupJobData = {
  triggeredBy: 'cron';
};

const buildConnectionOptions = (url: string) => {
  const parsed = new URL(url);

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: parsed.pathname ? Number(parsed.pathname.replace('/', '') || '0') : 0,
    maxRetriesPerRequest: null as null,
  };
};

const queueConnection = redisUrl ? buildConnectionOptions(redisUrl) : null;

const cleanupQueue = queueConnection
  ? new Queue<CleanupJobData, void, typeof CLEANUP_JOB_NAME>(CLEANUP_QUEUE_NAME, {
      connection: queueConnection,
    })
  : null;

let cleanupWorker: Worker<CleanupJobData, void, typeof CLEANUP_JOB_NAME> | null = null;

export const startMediaCleanupWorker = () => {
  if (!redisUrl) {
    logger.warn('REDIS_URL not set; orphaned media cleanup worker is disabled');
    return;
  }

  if (cleanupWorker) {
    return;
  }

  cleanupWorker = new Worker<CleanupJobData, void, typeof CLEANUP_JOB_NAME>(
    CLEANUP_QUEUE_NAME,
    async () => {
      await cleanupOrphanedMedia();
    },
    {
      connection: buildConnectionOptions(redisUrl),
      concurrency: 1,
    },
  );

  cleanupWorker.on('failed', (job, error) => {
    logger.error('Orphaned media cleanup job failed', {
      jobId: job?.id,
      error: error.message,
    });
  });
};

export const ensureMediaCleanupSchedule = async (): Promise<void> => {
  if (!cleanupQueue) {
    return;
  }

  await cleanupQueue.add(
    CLEANUP_JOB_NAME,
    { triggeredBy: 'cron' },
    {
      jobId: 'daily-orphaned-media-cleanup',
      repeat: {
        pattern: '0 2 * * *',
      },
      removeOnComplete: 30,
      removeOnFail: 100,
    },
  );
};
