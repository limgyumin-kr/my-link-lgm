import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[6px] px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#0078FF] text-white",
        secondary: "border-transparent bg-[#EBF5FF] text-[#0078FF]",
        outline: "border border-[#E5E8EF] text-[#697383] bg-white",
        destructive: "border-transparent bg-[#FFF0F3] text-[#FF3A5B]",
        success: "border-transparent bg-[#E6FEF0] text-[#04CA81]",
        inactive: "border-transparent bg-[#F2F3F8] text-[#99A1B1]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
