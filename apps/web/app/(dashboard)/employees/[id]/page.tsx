import { EmployeeDetailScreen } from "@/features/employees/employee-detail-screen";

export default async function EmployeeDetailPage(props: PageProps<"/employees/[id]">) {
  const { id } = await props.params;
  return <EmployeeDetailScreen id={id} />;
}
