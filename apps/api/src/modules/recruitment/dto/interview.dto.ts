import { AgendaItem, InterviewDocument, InterviewFormat, Panelist } from '../schemas/interview.schema';

export class InterviewResponseDto {
  id: string;
  jobTitle: string;
  department: string;
  scheduledAt: string;
  format: InterviewFormat;
  panelists: Panelist[];
  agenda: AgendaItem[];

  static fromDocument(doc: InterviewDocument): InterviewResponseDto {
    return {
      id: (doc._id as any).toString(),
      jobTitle: doc.jobTitle,
      department: doc.department,
      scheduledAt: doc.scheduledAt,
      format: doc.format,
      panelists: doc.panelists ?? [],
      agenda: doc.agenda ?? [],
    };
  }
}
