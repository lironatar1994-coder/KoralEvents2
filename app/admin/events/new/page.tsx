import { appPath } from "@/lib/paths";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { EventEditor } from "@/components/EventEditor";
export const dynamic = "force-dynamic";
export default async function NewEvent() {
  if (!(await isAdmin())) redirect(appPath("/admin/login"));
  return <EventEditor />;
}
