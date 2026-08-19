import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { requirePermission } from '../rbac/authorization';
import { PermissionCode } from '../rbac/constants/permission-code.enum';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

// Mirrors domain/audit_log/service.py's AuditLogService — no separate repository, matching the
// Python exception to the repository-layer pattern used elsewhere.
@Injectable()
export class AuditLogService {
  constructor(@InjectModel(AuditLog.name) private readonly model: Model<AuditLogDocument>) {}

  // Pure write, no authorization check — called internally by other services as a side effect
  // of mutations (currently only EmployeeService), never exposed as its own write endpoint.
  async log(
    params: {
      tenantId: string | Types.ObjectId;
      actorEmployeeId: string | Types.ObjectId | null;
      action: string;
      resourceType: string;
      resourceId: string;
      extra?: Record<string, unknown> | null;
    },
    session?: ClientSession,
  ): Promise<void> {
    await this.model.create(
      [
        {
          tenantId: params.tenantId,
          actorEmployeeId: params.actorEmployeeId,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          extra: params.extra ?? null,
        },
      ],
      { session },
    );
  }

  async listLogs(params: {
    tenantId: string;
    actorPermissions: ReadonlySet<PermissionCode>;
    offset: number;
    limit: number;
  }): Promise<{ items: AuditLogDocument[]; total: number }> {
    requirePermission(params.actorPermissions, PermissionCode.AUDIT_LOG_READ);
    const filter = { tenantId: params.tenantId };
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(params.offset).limit(params.limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }
}
