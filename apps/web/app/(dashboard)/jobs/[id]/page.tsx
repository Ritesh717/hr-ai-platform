import { JobDetailScreen } from "@/features/jobs/job-detail-screen";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobDetailScreen id={id} />;
}
