import { logger } from '../../core/logging/logger';
import { ReportModel } from '../reports/report.model';
import { MediaUploadModel } from './media-upload.model';
import { deleteObjectFromS3, listAllReportObjects, type S3ListedObject } from './media.s3';

const MIN_AGE_MS = 24 * 60 * 60 * 1000;

const isOlderThanCutoff = (item: S3ListedObject, cutoffMs: number): boolean => {
  if (!item.lastModified) {
    return false;
  }
  return item.lastModified.getTime() <= cutoffMs;
};

export const cleanupOrphanedMedia = async (): Promise<{
  scanned: number;
  candidates: number;
  deleted: number;
}> => {
  const cutoffMs = Date.now() - MIN_AGE_MS;
  const objects = await listAllReportObjects();
  const candidates = objects.filter((item) => isOlderThanCutoff(item, cutoffMs));

  if (candidates.length === 0) {
    logger.info('Media cleanup run complete; no eligible candidates');
    return { scanned: objects.length, candidates: 0, deleted: 0 };
  }

  const candidateUrls = candidates.map((item) => item.url);
  const linkedUrls = await ReportModel.distinct('media_urls', {
    media_urls: { $in: candidateUrls },
  });
  const linkedUrlSet = new Set(linkedUrls);

  let deleted = 0;
  for (const item of candidates) {
    if (linkedUrlSet.has(item.url)) {
      continue;
    }

    await deleteObjectFromS3(item.key);
    await MediaUploadModel.deleteOne({ key: item.key });
    deleted += 1;
  }

  logger.info('Media cleanup run complete', {
    scanned: objects.length,
    candidates: candidates.length,
    deleted,
  });

  return { scanned: objects.length, candidates: candidates.length, deleted };
};
