"use client";
import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useServerAction, type ClientActionResult } from "@/hooks/use-action";

export function ConfirmAction<T>({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  action,
  success,
  onDone,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  action: () => Promise<ClientActionResult<T>>;
  success?: string;
  onDone?: (data: T) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const { pending, execute } = useServerAction();
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            destructive={destructive}
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              void execute(action, { success, onSuccess: (d) => { setOpen(false); onDone?.(d); } });
            }}
          >
            {pending ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
