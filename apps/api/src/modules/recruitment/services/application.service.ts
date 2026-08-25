import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConflictError } from '../../../common/errors/app.error';
import { ApplicationCreateDto, ApplicationResponseDto } from '../dto/application.dto';
import { ApplicationRepository } from '../repositories/application.repository';
import { JobRepository } from '../repositories/job.repository';
import { ApplicationStatus } from '../schemas/application.schema';

@Injectable()
export class ApplicationService {
  constructor(
    private readonly appRepo: ApplicationRepository,
    private readonly jobRepo: JobRepository,
  ) {}

  async getApplications(tenantId: string, employeeId: string): Promise<ApplicationResponseDto[]> {
    const docs = await this.appRepo.findByEmployee(tenantId, employeeId);
    return docs.map(ApplicationResponseDto.fromDocument);
  }

  async apply(
    tenantId: string,
    employeeId: string,
    jobId: string,
    dto: ApplicationCreateDto,
  ): Promise<ApplicationResponseDto> {
    const job = await this.jobRepo.findById(jobId);
    if (!job || job.tenantId.toString() !== tenantId) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }
    const existing = await this.appRepo.findByJobAndEmployee(tenantId, jobId, employeeId);
    if (existing) {
      throw new ConflictError(`Already applied to job ${jobId}`);
    }
    const doc = await this.appRepo.create(tenantId, {
      jobId,
      employeeId,
      jobTitle: job.title,
      department: job.department,
      coverNote: dto.coverNote,
      appliedAt: new Date().toISOString().slice(0, 10),
      currentStage: 0,
      status: ApplicationStatus.ACTIVE,
    });
    return ApplicationResponseDto.fromDocument(doc);
  }

  async withdraw(tenantId: string, employeeId: string, id: string): Promise<void> {
    const doc = await this.appRepo.findById(id);
    if (!doc || doc.tenantId.toString() !== tenantId || doc.employeeId.toString() !== employeeId) {
      throw new NotFoundException(`Application ${id} not found`);
    }
    if (doc.status === ApplicationStatus.WITHDRAWN) {
      throw new BadRequestException('Application is already withdrawn');
    }
    await this.appRepo.updateStatus(id, ApplicationStatus.WITHDRAWN);
  }
}
