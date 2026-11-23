import { redirect } from "next/navigation";

export default async function DeliverablesRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/portal/projects/${id}?tab=deliverables`);
}
