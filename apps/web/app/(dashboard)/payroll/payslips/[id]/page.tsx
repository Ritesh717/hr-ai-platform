import { PayslipDetailScreen } from "@/features/payroll/payslip-detail-screen";

export default function PayslipDetailPage({ params }: { params: { id: string } }) {
  return <PayslipDetailScreen id={params.id} />;
}
