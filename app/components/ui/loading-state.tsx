import { Spinner } from "./spinner";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({ 
  message = "Loading...", 
  size = "md",
  className = "" 
}: LoadingStateProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center space-y-4 p-8 ${className}`}
      role="status"
      aria-label={message}
      aria-live="polite"
    >
      <Spinner size={size} />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

interface LoadingOverlayProps extends LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  message,
  size,
  className = ""
}: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm">
        <LoadingState 
          message={message} 
          size={size} 
          className={`h-full ${className}`} 
        />
      </div>
      <div 
        className="pointer-events-none opacity-50"
        aria-hidden={isLoading}
      >
        {children}
      </div>
    </div>
  );
} 