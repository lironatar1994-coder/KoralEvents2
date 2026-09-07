import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { EventEditor } from "@/components/EventEditor";
export const dynamic = "force-dynamic";
export default async function NewEvent() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <EventEditor />;
}
