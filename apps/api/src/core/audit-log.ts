export type AuditAction =
  | "report_created"
  | "report_status_updated"
  | "media_uploaded"
  | "auth_login"
  | "auth_logout";

export type AuditRecord = {
  actor: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export function buildAuditRecord(
  actor: string,
  action: AuditAction,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>,
): AuditRecord {
  return {
    actor,
    action,
    targetType,
    targetId,
    timestamp: new Date().toISOString(),
    metadata,
  };
}