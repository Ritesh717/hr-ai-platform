import { Injectable, NotFoundException } from '@nestjs/common';
import { JobCreateDto, JobResponseDto } from '../dto/job.dto';
import { JobRepository } from '../repositories/job.repository';
import { JobStatus } from '../schemas/job.schema';

@Injectable()
export class JobService {
  constructor(private readonly repo: JobRepository) {}

  async getOpenJobs(tenantId: string): Promise<JobResponseDto[]> {
    const docs = await this.repo.findOpen(tenantId);
    return docs.map(JobResponseDto.fromDocument);
  }

  async getJobById(tenantId: string, id: string): Promise<JobResponseDto> {
    const doc = await this.repo.findById(id);
    if (!doc || doc.tenantId.toString() !== tenantId) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    return JobResponseDto.fromDocument(doc);
  }

  async createJob(tenantId: string, dto: JobCreateDto): Promise<JobResponseDto> {
    const doc = await this.repo.create(tenantId, {
      title: dto.title,
      department: dto.department,
      location: dto.location,
      type: dto.type,
      experienceLevel: dto.experienceLevel,
      description: dto.description,
      sections: dto.sections ?? [],
      postedAt: new Date().toISOString().slice(0, 10),
      status: JobStatus.OPEN,
    });
    return JobResponseDto.fromDocument(doc);
  }
}
