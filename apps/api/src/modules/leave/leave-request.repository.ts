import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveRequest, LeaveRequestDocument, LeaveStatus } from './schemas/leave-request.schema';

@Injectable()
export class LeaveRequestRepository {
  constructor(@InjectModel(LeaveRequest.name) private readonly model: Model<LeaveRequestDocument>) {}

  getById(requestId: string | Types.ObjectId, tenantId: string | Types.ObjectId): Promise<LeaveRequestDocument | null> {
    return this.model.findOne({ _id: requestId, tenantId }).exec();
  }

  listForEmployee(params: {
    tenantId: string | Types.ObjectId;
    employeeId: string | Types.ObjectId;
  }): Promise<LeaveRequestDocument[]> {
    return this.model
      .find({ tenantId: params.tenantId, employeeId: params.employeeId })
      .sort({ startDate: -1 })
      .exec();
  }

  // Powers the balance calculation: approved requests for one employee whose startDate falls
  // within the given calendar year.
  listApprovedInYear(params: {
    tenantId: string | Types.ObjectId;
    employeeId: string | Types.ObjectId;
    year: number;
  }): Promise<LeaveRequestDocument[]> {
    const yearStart = new Date(Date.UTC(params.year, 0, 1));
    const yearEnd = new Date(Date.UTC(params.year + 1, 0, 1));
    return this.model
      .find({
        tenantId: params.tenantId,
        employeeId: params.employeeId,
        status: LeaveStatus.APPROVED,
        startDate: { $gte: yearStart, $lt: yearEnd },
      })
      .exec();
  }

  // Powers /leave/team: leave belonging to a given set of direct-report employee ids, filtered
  // by status (defaults to approved — the calendar view; the manager approvals view passes
  // 'pending' explicitly).
  listForEmployees(params: {
    tenantId: string | Types.ObjectId;
    employeeIds: (string | Types.ObjectId)[];
    status?: LeaveStatus;
  }): Promise<LeaveRequestDocument[]> {
    return this.model
      .find({
        tenantId: params.tenantId,
        employeeId: { $in: params.employeeIds },
        status: params.status ?? LeaveStatus.APPROVED,
      })
      .sort({ startDate: 1 })
      .exec();
  }

  async create(data: Partial<LeaveRequest>): Promise<LeaveRequestDocument> {
    const [request] = await this.model.create([data]);
    return request;
  }

  async save(request: LeaveRequestDocument): Promise<LeaveRequestDocument> {
    return request.save();
  }
}
