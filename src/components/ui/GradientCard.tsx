import { cn } from "@/lib/utils";
import React from "react";

export default function GradientCard({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "relative rounded-3xl bg-white shadow-soft ring-1 ring-black/5",
        "before:absolute before:inset-x-6 before:top-0 before:h-[4px] before:rounded-full",
        "before:bg-[linear-gradient(90deg,#7bc4ff_0%,#9f7cff_100%)]",
        "p-6 md:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}
