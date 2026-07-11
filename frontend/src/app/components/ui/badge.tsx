import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.02em] w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow,background-color,border-color] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-primary/15 bg-primary/12 text-primary [a&]:hover:bg-primary/18",
        secondary:
          "border-secondary/30 bg-secondary/18 text-secondary-foreground [a&]:hover:bg-secondary/25",
        destructive:
          "border-destructive/20 bg-destructive/12 text-destructive [a&]:hover:bg-destructive/18 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-primary/18 text-foreground bg-background/65 [a&]:hover:bg-accent/18 [a&]:hover:text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
