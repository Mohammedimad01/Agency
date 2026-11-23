"use client";
import { NativeSelect } from "@/components/shared/form";
import { useServerAction } from "@/hooks/use-action";
import { updateMeetingStatus } from "../actions";

export function MeetingStatusSelect({ id, status }: { id: string; status: string }) {
  const { execute, pending } = useServerAction();
  return (
    <NativeSelect aria-label="Update status" className="h-8 w-36" disabled={pending} value={status} onChange={(e) => execute(() => updateMeetingStatus(id, e.target.value))}>
      <option value="requested">Requested</option>
      <option value="scheduled">Scheduled</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </NativeSelect>
  );
}
