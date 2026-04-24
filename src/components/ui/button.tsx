import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:mr-0.5",
  {
    variants: {
      variant: {
        default:
          "text-white bg-gradient-to-r from-[hsl(340,72%,68%)] to-[hsl(330,80%,58%)] border border-white/30 shadow-[0_0_20px_rgba(244,114,182,0.45)] hover:shadow-[0_0_28px_rgba(244,114,182,0.65)] hover:scale-105 active:scale-100",
        destructive:
          "text-white bg-gradient-to-r from-[hsl(0,84%,65%)] to-[hsl(350,84%,55%)] border border-white/30 shadow-[0_0_20px_rgba(239,68,68,0.45)] hover:shadow-[0_0_28px_rgba(239,68,68,0.65)] hover:scale-105 active:scale-100",
        outline:
          "border border-input bg-background/60 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:scale-105",
        secondary:
          "bg-secondary text-secondary-foreground border border-white/40 hover:bg-secondary/80 hover:scale-105",
        ghost: "rounded-md hover:bg-accent hover:text-accent-foreground",
        link: "rounded-md text-primary underline-offset-4 hover:underline",
        premium:
          "text-white bg-gradient-to-r from-[hsl(340,72%,70%)] via-[hsl(330,80%,62%)] to-[hsl(320,75%,55%)] border border-white/40 shadow-[0_0_24px_rgba(244,114,182,0.55)] hover:shadow-[0_0_36px_rgba(244,114,182,0.75)] hover:scale-105 active:scale-100",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-11 px-8",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
