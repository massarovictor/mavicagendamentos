import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'skeleton' | 'dots';
  className?: string;
}

interface SkeletonProps {
  className?: string;
  count?: number;
}

// Loading Spinner
export const LoadingSpinner: React.FC<LoadingStateProps> = ({
  message = "Carregando...",
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} />
      {message && (
        <p className={cn("mt-4 text-gray-600", textSizeClasses[size])}>
          {message}
        </p>
      )}
    </div>
  );
};

// Skeleton Loading
export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = "", 
  count = 1 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "animate-pulse bg-gray-200 rounded",
            className
          )}
        />
      ))}
    </>
  );
};

// Card Skeleton
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
};

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} className="h-4 w-3/4" />
        ))}
      </div>
      
      {/* Rows Skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className="h-4 w-full" 
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Page Loading
export const PageLoading: React.FC<LoadingStateProps> = (props) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <LoadingSpinner {...props} />
    </div>
  );
};

// Inline Loading
export const InlineLoading: React.FC<{ message?: string }> = ({ 
  message = "Carregando..." 
}) => {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  );
};

// Button Loading
export const ButtonLoading: React.FC<{ message?: string }> = ({ 
  message = "Processando..." 
}) => {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
}; 