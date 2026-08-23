import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument, JobStatus } from '../schemas/job.schema';

@Injectable()
export class JobRepository {
  constructor(@InjectModel(Job.name) private readonly model: Model<JobDocument>) {}

  async findOpen(tenantId: string): Promise<JobDocument[]> {
    return this.model
      .find({ tenantId: new Types.ObjectId(tenantId), status: JobStatus.OPEN })
      .sort({ postedAt: -1 });
  }

  async findById(id: string): Promise<JobDocument | null> {
    return this.model.findById(id);
  }

  async create(tenantId: string, data: Omit<Job, 'tenantId'>): Promise<JobDocument> {
    return this.model.create({ ...data, tenantId: new Types.ObjectId(tenantId) });
  }
}
