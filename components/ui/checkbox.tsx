import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// Premium modern checkbox with refined micro-interactions
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    indeterminate?: boolean;
  }
>(({ className, indeterminate, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Base sizing and layout
      "peer relative flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center",
      "rounded-[5px]",
      // Default state - subtle, refined border
      "border-slate-700 bg-white",
      // Smooth transitions for all properties
      "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
      // Hover - gentle lift with color shift
      "hover:border-slate-600 hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
      // Focus - clean ring without offset clutter
      "focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-indigo-500/30 focus-visible:ring-offset-0",
      // Checked state - rich indigo with depth
      "data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600",
      "data-[state=checked]:shadow-[0_1px_2px_rgba(79,70,229,0.25)]",
      // Indeterminate state
      "data-[state=indeterminate]:border-indigo-600 data-[state=indeterminate]:bg-indigo-600",
      // Active/press state
      "active:scale-[0.96]",
      // Disabled state - muted, non-interactive appearance
      "disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50",
      "data-[state=checked]:disabled:border-slate-300 data-[state=checked]:disabled:bg-slate-300",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center text-white",
        // Icon animation - scale and fade in
        "scale-75 opacity-0 transition-all duration-150 ease-out",
        "data-[state=checked]:scale-100 data-[state=checked]:opacity-100",
        "data-[state=indeterminate]:scale-100 data-[state=indeterminate]:opacity-100",
      )}
    >
      {indeterminate ? (
        <Minus className="h-2.5 w-2.5 stroke-[3]" />
      ) : (
        <Check className="h-3 w-3 stroke-[3]" />
      )}
    </CheckboxPrimitive.Indicator>
    
    {/* Subtle inner highlight for depth */}
    <div className={cn(
      "pointer-events-none absolute inset-0 rounded-[4px]",
      "bg-gradient-to-b from-white/20 to-transparent opacity-0 transition-opacity duration-200",
      "peer-data-[state=checked]:opacity-100 peer-data-[state=indeterminate]:opacity-100",
    )} />
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };