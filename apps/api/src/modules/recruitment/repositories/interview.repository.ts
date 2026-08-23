import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Interview, InterviewDocument, InterviewStatus } from '../schemas/interview.schema';

@Injectable()
export class InterviewRepository {
  constructor(@InjectModel(Interview.name) private readonly model: Model<InterviewDocument>) {}

  async findByCandidate(tenantId: string, candidateId: string): Promise<InterviewDocument[]> {
    return this.model
      .find({
        tenantId: new Types.ObjectId(tenantId),
        candidateId: new Types.ObjectId(candidateId),
        status: InterviewStatus.SCHEDULED,
      })
      .sort({ scheduledAt: 1 });
  }

  async findById(id: string): Promise<InterviewDocument | null> {
    return this.model.findById(id);
  }

  async cancel(id: string): Promise<InterviewDocument | null> {
    return this.model.findByIdAndUpdate(
      id,
      { $set: { status: InterviewStatus.CANCELLED } },
      { new: true },
    );
  }

  async create(tenantId: string, data: Omit<Interview, 'tenantId' | 'applicationId' | 'candidateId'> & { applicationId: string; candidateId: string }): Promise<InterviewDocument> {
    return this.model.create({
      ...data,
      tenantId: new Types.ObjectId(tenantId),
      applicationId: new Types.ObjectId(data.applicationId),
      candidateId: new Types.ObjectId(data.candidateId),
    });
  }
}
