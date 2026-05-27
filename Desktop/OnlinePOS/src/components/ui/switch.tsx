"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

function Switch({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  ...props
}: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 p-0.5 shadow-sm transition-all outline-none",
        "border-gray-300 bg-gray-200 data-unchecked:bg-gray-200",
        "data-checked:border-orange-500 data-checked:bg-orange-500 data-checked:shadow-md",
        "focus-visible:ring-3 focus-visible:ring-orange-500/35",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-6 rounded-full border border-gray-200/80 bg-white shadow-md transition-transform",
          "translate-x-0 data-checked:translate-x-6",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
