import { Injectable, NotFoundException } from '@nestjs/common';
import { InterviewResponseDto } from '../dto/interview.dto';
import { InterviewRepository } from '../repositories/interview.repository';

@Injectable()
export class InterviewService {
  constructor(private readonly repo: InterviewRepository) {}

  async getInterviews(tenantId: string, candidateId: string): Promise<InterviewResponseDto[]> {
    const docs = await this.repo.findByCandidate(tenantId, candidateId);
    return docs.map(InterviewResponseDto.fromDocument);
  }

  async cancel(tenantId: string, candidateId: string, id: string): Promise<void> {
    const doc = await this.repo.findById(id);
    if (!doc || doc.tenantId.toString() !== tenantId || doc.candidateId.toString() !== candidateId) {
      throw new NotFoundException(`Interview ${id} not found`);
    }
    await this.repo.cancel(id);
  }
}
