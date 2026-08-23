import { IsOptional, IsString } from 'class-validator';
import { ApplicationDocument, ApplicationStatus } from '../schemas/application.schema';

export class ApplicationCreateDto {
  @IsOptional()
  @IsString()
  coverNote?: string;
}

export class ApplicationResponseDto {
  id: string;
  jobTitle: string;
  department: string;
  appliedAt: string;
  updatedAt: string;
  currentStage: number;
  status: ApplicationStatus;

  static fromDocument(doc: ApplicationDocument): ApplicationResponseDto {
    return {
      id: (doc._id as any).toString(),
      jobTitle: doc.jobTitle,
      department: doc.department,
      appliedAt: doc.appliedAt,
      updatedAt: doc.updatedAt?.toISOString().slice(0, 10) ?? doc.appliedAt,
      currentStage: doc.currentStage,
      status: doc.status,
    };
  }
}
