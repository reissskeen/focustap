import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonColorfulVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      gradient: {
        none: "",
        primary: "",
        blue: "",
        green: "",
        amber: "",
        destructive: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      gradient: "none",
    },
  }
);

const gradientMap: Record<string, string> = {
  primary: "from-primary via-accent to-primary",
  blue: "from-[hsl(var(--gradient-blue-from))] via-[hsl(var(--gradient-blue-via))] to-[hsl(var(--gradient-blue-to))]",
  green: "from-[hsl(var(--gradient-green-from))] via-[hsl(var(--gradient-green-via))] to-[hsl(var(--gradient-green-to))]",
  amber: "from-[hsl(var(--gradient-amber-from))] via-[hsl(var(--gradient-amber-via))] to-[hsl(var(--gradient-amber-to))]",
  destructive: "from-[hsl(var(--gradient-destructive-from))] via-[hsl(var(--gradient-destructive-via))] to-[hsl(var(--gradient-destructive-to))]",
};

export interface ButtonColorfulProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonColorfulVariants> {
  asChild?: boolean;
}

const ButtonColorful = React.forwardRef<HTMLButtonElement, ButtonColorfulProps>(
  ({ className, variant, size, gradient = "none", asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const showGradient = gradient && gradient !== "none";
    
    // Auto-select gradient based on variant if not specified
    const effectiveGradient = showGradient ? gradient : 
      variant === "destructive" ? "destructive" :
      variant === "default" || variant === undefined ? "primary" : 
      null;
    
    const shouldShowOverlay = effectiveGradient && 
      variant !== "ghost" && variant !== "link" && 
      gradientMap[effectiveGradient];

    return (
      <Comp
        className={cn(buttonColorfulVariants({ variant, size, gradient, className }))}
        ref={ref}
        {...props}
      >
        {shouldShowOverlay && (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-r",
              gradientMap[effectiveGradient!],
              "opacity-0 group-hover:opacity-30",
              "blur-sm transition-opacity duration-500 pointer-events-none"
            )}
          />
        )}
        <span className="relative flex items-center justify-center gap-2">
          {children}
        </span>
      </Comp>
    );
  }
);
ButtonColorful.displayName = "ButtonColorful";

export { ButtonColorful, buttonColorfulVariants };
