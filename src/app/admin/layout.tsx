import { requireSession } from "@/lib/auth/session";
import { getContest } from "@/lib/services/judging";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["ADMIN", "SUPER_ADMIN"]);
  const contest = await getContest(session.contestId!);
  return <AdminShell contestName={contest?.name ?? "Contest"} userName={session.name}>{children}</AdminShell>;
}
