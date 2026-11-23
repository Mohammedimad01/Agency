"use client";
import * as React from "react";
const CloseContext = React.createContext<(() => void) | undefined>(undefined);
/** Inside a FormDialog, returns a function that closes it. */
export function useDialogClose() {
  return React.useContext(CloseContext);
}

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** Dialog whose body receives a `close` callback (used by forms on success). */
export function FormDialog({
  trigger,
  title,
  description,
  size = "md",
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internal, setInternal] = React.useState(false);
  const open = controlledOpen ?? internal;
  const setOpen = onOpenChange ?? setInternal;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {open ? <CloseContext.Provider value={() => setOpen(false)}>{typeof children === "function" ? children(() => setOpen(false)) : children}</CloseContext.Provider> : null}
      </DialogContent>
    </Dialog>
  );
}
