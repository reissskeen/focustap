import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface ButtonColorfulProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export function ButtonColorful({
  className,
  label = "Explore Components",
  ...props
}: ButtonColorfulProps) {
  return (
    <Button
      className={cn(
        "relative h-10 px-4 overflow-hidden",
        "bg-foreground dark:bg-foreground",
        "transition-all duration-200",
        "group",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-r from-primary via-accent to-primary",
          "opacity-40 group-hover:opacity-80",
          "blur transition-opacity duration-500"
        )}
      />
      <div className="relative flex items-center justify-center gap-2">
        <span className="text-background">{label}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-background/90" />
      </div>
    </Button>
  );
}
