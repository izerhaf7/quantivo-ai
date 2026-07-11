import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.85rem] text-sm font-semibold tracking-[-0.01em] transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 active:translate-y-[1px] active:scale-[0.99] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_10px_24px_-16px_color-mix(in_srgb,var(--primary)_70%,black)] hover:bg-primary/92 hover:shadow-[0_14px_32px_-18px_color-mix(in_srgb,var(--primary)_80%,black)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-primary/20 bg-background/70 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] hover:border-primary/35 hover:bg-primary/8 hover:text-foreground dark:bg-input/30 dark:border-primary/20 dark:hover:bg-primary/12",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/85 shadow-[0_8px_20px_-18px_color-mix(in_srgb,var(--secondary)_80%,black)]",
        ghost:
          "hover:bg-accent/18 hover:text-foreground dark:hover:bg-accent/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-9 rounded-[0.75rem] gap-1.5 px-3.5 has-[>svg]:px-3",
        lg: "h-12 rounded-[1rem] px-7 has-[>svg]:px-5",
        icon: "size-11 rounded-[0.85rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
