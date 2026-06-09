"use client";
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
  cloneElement,
  isValidElement,
  MouseEventHandler,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Tooltip Context ───────────────────────────────────────────────

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  position: { x: number; y: number };
  setPosition: (pos: { x: number; y: number }) => void;
  side: "top" | "bottom" | "left" | "right";
  setSide: (side: "top" | "bottom" | "left" | "right") => void;
  variant: "default" | "info" | "warning" | "destructive";
  setVariant: (v: "default" | "info" | "warning" | "destructive") => void;
}

const TooltipContext = createContext<TooltipContextType | null>(null);

// ─── Tooltip Provider ──────────────────────────────────────────────

interface TooltipProviderProps {
  children: ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
}

const TooltipProvider = ({ children }: TooltipProviderProps) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [side, setSide] = useState<"top" | "bottom" | "left" | "right">("top");
  const [variant, setVariant] = useState<
    "default" | "info" | "warning" | "destructive"
  >("default");

  const contextValue: TooltipContextType = {
    open,
    setOpen,
    position,
    setPosition,
    side,
    setSide,
    variant,
    setVariant,
  };

  return (
    <TooltipContext.Provider value={contextValue}>
      {children}
    </TooltipContext.Provider>
  );
};

// ─── Tooltip ───────────────────────────────────────────────────────

interface TooltipProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children: ReactNode;
}

const Tooltip = ({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  children,
}: TooltipProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const currentOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) setInternalOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const contextValue: TooltipContextType = {
    open: currentOpen,
    setOpen: handleOpenChange,
    position: { x: 0, y: 0 },
    setPosition: () => {},
    side: "top",
    setSide: () => {},
    variant: "default",
    setVariant: () => {},
  };

  return (
    <TooltipContext.Provider value={contextValue}>
      {children}
    </TooltipContext.Provider>
  );
};

// ─── Tooltip Trigger ───────────────────────────────────────────────

interface TooltipTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

const TooltipTrigger = ({ children, asChild = false }: TooltipTriggerProps) => {
  const context = useContext(TooltipContext);
  if (!context)
    throw new Error(
      "TooltipTrigger must be used within a TooltipProvider or Tooltip"
    );

  const { setOpen, setPosition } = context;
  const child =
    asChild && isValidElement(children) ? children : <span>{children}</span>;

  const handleMouseEnter: MouseEventHandler<HTMLElement> = (e) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    context.setSide("top");
    setOpen(true);
  };

  const handleMouseLeave = () => {
    setOpen(false);
  };

  const handleClick = () => {
    setOpen(!context.open);
  };

  const mergedProps: Record<string, unknown> = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
    "data-tooltip-trigger": true,
    style: { cursor: "pointer" },
  };

  return cloneElement(child as React.ReactElement, mergedProps);
};

// ─── Tooltip Content ───────────────────────────────────────────────

interface TooltipContentProps {
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  variant?: "default" | "info" | "warning" | "destructive";
  align?: "center" | "start" | "end";
  hidden?: boolean;
  className?: string;
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  (
    {
      children,
      side = "top",
      sideOffset = 8,
      variant = "default",
      className = "",
      hidden,
      align,
      ...props
    },
    ref
  ) => {
    const context = useContext(TooltipContext);
    if (!context)
      throw new Error(
        "TooltipContent must be used within a TooltipProvider or Tooltip"
      );

    const { open, position } = context;

    // Don't render if hidden
    if (hidden) return null;

    // Variant styles
    const variantStyles = {
      default:
        "bg-slate-900/95 text-slate-100 border-slate-700/50 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)]",
      info: "bg-blue-600/95 text-white border-blue-500/40 shadow-[0_8px_32px_-8px_rgba(37,99,235,0.35)]",
      warning:
        "bg-amber-500/95 text-white border-amber-400/40 shadow-[0_8px_32px_-8px_rgba(245,158,11,0.35)]",
      destructive:
        "bg-red-600/95 text-white border-red-500/40 shadow-[0_8px_32px_-8px_rgba(239,68,68,0.35)]",
    };

    // Side offsets
    const sideOffsetMap: Record<string, { x: string; y: string }> = {
      top: { x: "-50%", y: `-${sideOffset + 8}px` },
      bottom: { x: "-50%", y: `${sideOffset + 8}px` },
      left: { x: `-${sideOffset + 8}px`, y: "-50%" },
      right: { x: `${sideOffset + 8}px`, y: "-50%" },
    };

    // Arrow rotation per side
    const arrowRotate: Record<string, string> = {
      top: "0deg",
      bottom: "180deg",
      left: "-90deg",
      right: "90deg",
    };

    const arrowStyle: Record<
      string,
      { bottom?: string; top?: string; left?: string; right?: string }
    > = {
      top: { bottom: "-1.3px", left: "calc(50% - 5px)" },
      bottom: { top: "-1.3px", left: "calc(50% - 5px)" },
      left: { right: "-1.3px", top: "calc(50% - 5px)" },
      right: { left: "-1.3px", top: "calc(50% - 5px)" },
    };

    return (
      <AnimatePresence>
        {open && (
          <motion.div
            ref={ref}
            initial={{
              opacity: 0,
              scale: 0.92,
              y: side === "top" ? 4 : side === "bottom" ? -4 : 0,
              x: side === "left" ? 4 : side === "right" ? -4 : 0,
            }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{
              opacity: 0,
              scale: 0.92,
              y: side === "top" ? -4 : side === "bottom" ? 4 : 0,
              x: side === "left" ? -4 : side === "right" ? 4 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              mass: 0.4,
            }}
            style={{
              position: "fixed",
              left: position.x,
              top: position.y,
              transform: `translate(${sideOffsetMap[side].x}, ${sideOffsetMap[side].y})`,
              zIndex: 9999,
              pointerEvents: "none",
              maxWidth: "260px",
              width: "max-content",
            }}
            className={cn(
              "rounded-lg border px-3.5 py-2 text-sm font-medium backdrop-blur-xl",
              variantStyles[variant],
              className
            )}
            {...props}
          >
            {children}
            {/* Custom arrow */}
            <div
              className="absolute w-2.5 h-2.5 rotate-45 border-t border-l"
              style={{
                borderColor: "inherit",
                background: "inherit",
                ...arrowStyle[side],
                transform: `rotate(${arrowRotate[side]})`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
TooltipContent.displayName = "TooltipContent";

// ─── Tooltip Portal ────────────────────────────────────────────────

interface TooltipPortalProps {
  children: ReactNode;
}

const TooltipPortal = ({ children }: TooltipPortalProps) => {
  return <>{children}</>;
};

// ─── Exports ───────────────────────────────────────────────────────

export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
};
