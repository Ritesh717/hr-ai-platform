"use client";

import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { clearToken } from "@/lib/auth/token";

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();

  return (
    <AuthGuard>
      {isLoading || !currentUser ? (
        <div className="glass-backdrop flex h-dvh w-full items-center justify-center p-6">
          <Skeleton className="h-9 w-64" />
        </div>
      ) : (
        <AppShell
          user={currentUser}
          onSignOut={() => {
            clearToken();
            router.push("/login");
          }}
        >
          {children}
        </AppShell>
      )}
    </AuthGuard>
  );
}
