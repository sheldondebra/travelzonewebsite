"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { cn } from "@/lib/utils";

function RadioGroup({
  className,
  ...props
}: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

function Radio({
  className,
  ...props
}: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio"
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border border-gray-200/90 bg-white shadow-sm transition-all outline-none",
        "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25",
        "data-checked:border-primary data-checked:bg-primary",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator className="flex items-center justify-center before:block before:size-2 before:rounded-full before:bg-primary-foreground" />
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, Radio };
