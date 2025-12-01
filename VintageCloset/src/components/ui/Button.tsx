import * as React from "react";
import { cn } from "@/lib/utils";
import { CircleNotch } from "@phosphor-icons/react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "text";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    
    const variants = {
      primary: "bg-[#071920] text-white hover:bg-gradient-accent transition-all shadow-sm border border-transparent",
      secondary: "bg-white text-ink border border-hairline hover:border-accent-start hover:shadow-inner transition-colors",
      ghost: "bg-transparent text-accent-start hover:bg-accent-start/10",
      text: "bg-transparent text-ink hover:text-accent-start p-0 h-auto",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-5 text-sm",
      lg: "h-12 px-8 text-base",
      icon: "h-10 w-10 p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center rounded-[var(--radius-base)] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-start/35 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          size !== "icon" && sizes[size],
          size === "icon" && sizes.icon,
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <CircleNotch className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };


