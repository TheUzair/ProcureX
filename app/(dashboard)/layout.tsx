import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const initialUser = {
    id: session.userId,
    email: session.email,
    username: session.username,
    full_name: null,
    mobile: null,
    is_active: true,
    created_at: "",
  };

  return (
    <AuthProvider initialUser={initialUser}>
      <SocketProvider>
        <DashboardShell>{children}</DashboardShell>
      </SocketProvider>
    </AuthProvider>
  );
}
