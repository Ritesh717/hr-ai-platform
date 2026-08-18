import { AppShell } from "@/components/layout/app-shell";

const currentUser = {
  name: "Carla Sanford",
  role: "HR Administrator",
  avatarUrl: null,
};

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell user={currentUser}>{children}</AppShell>;
}
