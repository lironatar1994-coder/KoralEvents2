import { appPath } from "@/lib/paths";
import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getEvent } from "@/lib/events";
import { EventEditor } from "@/components/EventEditor";
export const dynamic = "force-dynamic";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect(appPath("/admin/login"));
  const e = await getEvent((await params).id, true);
  if (!e) notFound();
  return <EventEditor event={e} />;
}
