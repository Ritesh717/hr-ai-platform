import { AuditLogDocument } from '../schemas/audit-log.schema';

export class AuditLogResponseDto {
  id: string;
  tenantId: string;
  actorEmployeeId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  extra: Record<string, unknown> | null;
  createdAt: Date;

  static fromDocument(log: AuditLogDocument): AuditLogResponseDto {
    return {
      id: log._id.toString(),
      tenantId: log.tenantId.toString(),
      actorEmployeeId: log.actorEmployeeId ? log.actorEmployeeId.toString() : null,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      extra: log.extra,
      createdAt: log.createdAt as Date,
    };
  }
}

export class AuditLogListResponseDto {
  items: AuditLogResponseDto[];
  total: number;
}
