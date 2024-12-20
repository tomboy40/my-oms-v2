import { Button } from "./button";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-gray-200 bg-white p-8 text-center ${className}`}
      role="region"
      aria-label={title}
    >
      {icon && (
        <div 
          className="rounded-full bg-gray-50 p-3"
          aria-hidden="true"
        >
          <div className="h-6 w-6 text-gray-400">{icon}</div>
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action && (
        <Button
          variant={action.variant ?? "outline"}
          size="sm"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
} 