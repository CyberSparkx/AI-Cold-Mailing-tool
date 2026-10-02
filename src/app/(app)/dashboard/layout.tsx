import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/platform/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PageTransition } from "@/components/motion/page-transition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Belt-and-suspenders check. Middleware already blocks unauthenticated
  // requests, but this ensures the layout never renders for an unauth'd user
  // even if the middleware config is updated later.
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto" data-lenis-prevent>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
