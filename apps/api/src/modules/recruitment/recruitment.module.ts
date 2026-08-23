import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationController } from './controllers/application.controller';
import { InterviewController } from './controllers/interview.controller';
import { JobController } from './controllers/job.controller';
import { ApplicationRepository } from './repositories/application.repository';
import { InterviewRepository } from './repositories/interview.repository';
import { JobRepository } from './repositories/job.repository';
import { Application, ApplicationSchema } from './schemas/application.schema';
import { Interview, InterviewSchema } from './schemas/interview.schema';
import { Job, JobSchema } from './schemas/job.schema';
import { ApplicationService } from './services/application.service';
import { InterviewService } from './services/interview.service';
import { JobService } from './services/job.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Interview.name, schema: InterviewSchema },
    ]),
  ],
  controllers: [JobController, ApplicationController, InterviewController],
  providers: [
    JobRepository,
    ApplicationRepository,
    InterviewRepository,
    JobService,
    ApplicationService,
    InterviewService,
  ],
})
export class RecruitmentModule {}
