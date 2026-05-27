"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { typeConfig } from "@/components/dashboard/tasks/tasks-styles";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onSubmit: (payload: {
    title: string;
    description?: string;
    type: string;
    dueDate?: string;
  }) => void;
};

const types = Object.keys(typeConfig);

export function TaskCreateDialog({
  open,
  onOpenChange,
  loading,
  onSubmit,
}: Props) {
  const [type, setType] = useState("GENERAL");

  useEffect(() => {
    if (open) setType("GENERAL");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border-primary/15 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-primary/15 bg-gradient-to-r from-primary/30 via-brand-rose/50 to-brand-cream px-5 pb-4 pt-5 text-left">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Sparkles className="size-4 text-primary-foreground" />
            </span>
            New task
          </DialogTitle>
          <DialogDescription className="text-foreground/70">
            Assign work for packing, delivery, inventory, or follow-ups.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 bg-gradient-to-b from-brand-cream/40 to-white p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onSubmit({
              title: fd.get("title") as string,
              description: (fd.get("description") as string) || undefined,
              type,
              dueDate: (fd.get("dueDate") as string) || undefined,
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              name="title"
              required
              placeholder="Pack order #1042"
              className="h-11 rounded-xl border-primary/15 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-type">Type</Label>
            <Select value={type} onValueChange={(v) => v && setType(String(v))}>
              <SelectTrigger id="task-type" className="h-11 rounded-xl border-primary/15 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => {
                  const meta = typeConfig[t];
                  const Icon = meta.icon;
                  return (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        <Icon className="size-4 opacity-70" />
                        {meta.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-due">Due date (optional)</Label>
            <Input
              id="task-due"
              name="dueDate"
              type="date"
              className="h-11 rounded-xl border-primary/15 bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Notes (optional)</Label>
            <Textarea
              id="task-desc"
              name="description"
              rows={3}
              placeholder="Special instructions for your team…"
              className="resize-none rounded-xl border-primary/15 bg-white"
            />
          </div>

          <Button
            type="submit"
            className="h-11 w-full rounded-xl font-semibold shadow-soft"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create task"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
