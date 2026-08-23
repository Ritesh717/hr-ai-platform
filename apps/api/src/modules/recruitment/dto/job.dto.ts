import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ExperienceLevel, JobSection, JobStatus, JobType } from '../schemas/job.schema';
import { JobDocument } from '../schemas/job.schema';

export class JobSectionDto {
  @IsString() heading: string;
  @IsString() body: string;
}

export class JobCreateDto {
  @IsString() title: string;
  @IsString() department: string;
  @IsString() location: string;
  @IsEnum(JobType) type: JobType;
  @IsEnum(ExperienceLevel) experienceLevel: ExperienceLevel;
  @IsString() description: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => JobSectionDto)
  sections?: JobSectionDto[];
}

export class JobResponseDto {
  id: string;
  title: string;
  department: string;
  location: string;
  type: JobType;
  experienceLevel: ExperienceLevel;
  matchScore: number;
  postedAt: string;
  description: string;
  status: JobStatus;
  sections: JobSection[];

  static fromDocument(doc: JobDocument): JobResponseDto {
    return {
      id: (doc._id as any).toString(),
      title: doc.title,
      department: doc.department,
      location: doc.location,
      type: doc.type,
      experienceLevel: doc.experienceLevel,
      matchScore: 0, // Stage 9 agent will compute AI-powered match score
      postedAt: doc.postedAt,
      description: doc.description,
      status: doc.status,
      sections: doc.sections ?? [],
    };
  }
}
