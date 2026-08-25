import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument, ApplicationStatus } from '../schemas/application.schema';

@Injectable()
export class ApplicationRepository {
  constructor(@InjectModel(Application.name) private readonly model: Model<ApplicationDocument>) {}

  async findByEmployee(tenantId: string, employeeId: string): Promise<ApplicationDocument[]> {
    return this.model
      .find({
        tenantId: new Types.ObjectId(tenantId),
        employeeId: new Types.ObjectId(employeeId),
      })
      .sort({ appliedAt: -1 });
  }

  async findById(id: string): Promise<ApplicationDocument | null> {
    return this.model.findById(id);
  }

  async findByJobAndEmployee(
    tenantId: string,
    jobId: string,
    employeeId: string,
  ): Promise<ApplicationDocument | null> {
    return this.model.findOne({
      tenantId: new Types.ObjectId(tenantId),
      jobId: new Types.ObjectId(jobId),
      employeeId: new Types.ObjectId(employeeId),
    });
  }

  async create(
    tenantId: string,
    data: Omit<Application, 'tenantId' | 'jobId' | 'employeeId'> & { jobId: string; employeeId: string },
  ): Promise<ApplicationDocument> {
    return this.model.create({
      ...data,
      tenantId: new Types.ObjectId(tenantId),
      jobId: new Types.ObjectId(data.jobId),
      employeeId: new Types.ObjectId(data.employeeId),
    });
  }

  async updateStatus(id: string, status: ApplicationStatus): Promise<ApplicationDocument | null> {
    return this.model.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  }
}
