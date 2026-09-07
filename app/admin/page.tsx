import { appPath } from "@/lib/paths";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getEvents } from "@/lib/events";
import { AdminDashboard } from "@/components/AdminDashboard";
export const dynamic = "force-dynamic";
export default async function Admin() {
  if (!(await isAdmin())) redirect(appPath("/admin/login"));
  return <AdminDashboard events={await getEvents(true)} />;
}
