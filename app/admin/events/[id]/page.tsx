import { appPath } from "@/lib/paths";
import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getEvent, registrations } from "@/lib/events";
import { EventManager } from "@/components/EventManager";
export const dynamic = "force-dynamic";
export default async function Manage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect(appPath("/admin/login"));
  const e = await getEvent((await params).id, true);
  if (!e) notFound();
  return (
    <EventManager
      initialEvent={e}
      initialRegistrations={await registrations(e.id)}
    />
  );
}
