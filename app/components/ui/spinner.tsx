import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div role="status" className="flex items-center justify-center">
      <Loader2 className={`animate-spin text-primary-600 ${sizes[size]} ${className}`} />
      <span className="sr-only">Loading...</span>
    </div>
  );
} 