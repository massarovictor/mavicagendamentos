import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, Home, Wifi, WifiOff } from 'lucide-react';
import { Button } from './button';
import { Alert, AlertDescription } from './alert';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  variant?: 'error' | 'warning' | 'info' | 'network';
  size?: 'sm' | 'md' | 'lg';
  showRetry?: boolean;
  showGoBack?: boolean;
  showGoHome?: boolean;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  className?: string;
}

interface InlineErrorProps {
  message: string;
  variant?: 'error' | 'warning';
  className?: string;
}

// Error State principal
export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  variant = 'error',
  size = 'md',
  showRetry = true,
  showGoBack = false,
  showGoHome = false,
  onRetry,
  onGoBack,
  onGoHome,
  className = ""
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'network':
        return WifiOff;
      case 'warning':
        return AlertCircle;
      case 'info':
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const getColors = () => {
    switch (variant) {
      case 'error':
        return {
          icon: 'text-red-500',
          bg: 'bg-red-50',
          border: 'border-red-200'
        };
      case 'warning':
        return {
          icon: 'text-yellow-500',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200'
        };
      case 'network':
        return {
          icon: 'text-orange-500',
          bg: 'bg-orange-50',
          border: 'border-orange-200'
        };
      default:
        return {
          icon: 'text-blue-500',
          bg: 'bg-blue-50',
          border: 'border-blue-200'
        };
    }
  };

  const getSizes = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'py-8',
          icon: 'h-8 w-8',
          title: 'text-lg',
          message: 'text-sm'
        };
      case 'lg':
        return {
          container: 'py-16',
          icon: 'h-16 w-16',
          title: 'text-2xl',
          message: 'text-lg'
        };
      default:
        return {
          container: 'py-12',
          icon: 'h-12 w-12',
          title: 'text-xl',
          message: 'text-base'
        };
    }
  };

  const Icon = getIcon();
  const colors = getColors();
  const sizes = getSizes();

  const getDefaultTitle = () => {
    switch (variant) {
      case 'network':
        return 'Problema de Conexão';
      case 'warning':
        return 'Atenção';
      case 'info':
        return 'Informação';
      default:
        return 'Algo deu errado';
    }
  };

  const getDefaultMessage = () => {
    switch (variant) {
      case 'network':
        return 'Verifique sua conexão com a internet e tente novamente.';
      case 'warning':
        return 'Verifique os dados e tente novamente.';
      case 'info':
        return 'Nenhum item encontrado.';
      default:
        return 'Ocorreu um erro inesperado. Tente novamente.';
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", sizes.container, className)}>
      <div className={cn("p-4 rounded-full mb-4", colors.bg, colors.border, 'border')}>
        <Icon className={cn(sizes.icon, colors.icon)} />
      </div>
      
      <h3 className={cn("font-semibold text-gray-900 mb-2", sizes.title)}>
        {title || getDefaultTitle()}
      </h3>
      
      <p className={cn("text-gray-600 mb-6 max-w-md", sizes.message)}>
        {message || getDefaultMessage()}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {showRetry && onRetry && (
          <Button onClick={onRetry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        )}
        
        {showGoBack && onGoBack && (
          <Button variant="outline" onClick={onGoBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        )}
        
        {showGoHome && onGoHome && (
          <Button variant="outline" onClick={onGoHome} className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Ir para Início
          </Button>
        )}
      </div>
    </div>
  );
};

// Inline Error para formulários e componentes menores
export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  variant = 'error',
  className = ""
}) => {
  return (
    <Alert 
      className={cn(
        "border-l-4",
        variant === 'error' 
          ? "border-l-red-500 bg-red-50 border-red-200" 
          : "border-l-yellow-500 bg-yellow-50 border-yellow-200",
        className
      )}
    >
      <AlertCircle className={cn(
        "h-4 w-4",
        variant === 'error' ? "text-red-500" : "text-yellow-500"
      )} />
      <AlertDescription className={cn(
        variant === 'error' ? "text-red-700" : "text-yellow-700"
      )}>
        {message}
      </AlertDescription>
    </Alert>
  );
};

// Network Error específico
export const NetworkError: React.FC<Omit<ErrorStateProps, 'variant'>> = (props) => {
  return (
    <ErrorState
      {...props}
      variant="network"
      title="Sem Conexão"
      message="Verifique sua conexão com a internet e tente novamente."
    />
  );
};

// Not Found Error
export const NotFoundError: React.FC<{
  resource?: string;
  onGoBack?: () => void;
  onGoHome?: () => void;
}> = ({ 
  resource = "página", 
  onGoBack, 
  onGoHome 
}) => {
  return (
    <ErrorState
      title="Não Encontrado"
      message={`A ${resource} que você está procurando não foi encontrada.`}
      variant="info"
      showRetry={false}
      showGoBack={!!onGoBack}
      showGoHome={!!onGoHome}
      onGoBack={onGoBack}
      onGoHome={onGoHome}
    />
  );
};

// Permission Error
export const PermissionError: React.FC<{
  onGoBack?: () => void;
  onGoHome?: () => void;
}> = ({ onGoBack, onGoHome }) => {
  return (
    <ErrorState
      title="Acesso Negado"
      message="Você não tem permissão para acessar este recurso."
      variant="warning"
      showRetry={false}
      showGoBack={!!onGoBack}
      showGoHome={!!onGoHome}
      onGoBack={onGoBack}
      onGoHome={onGoHome}
    />
  );
};

// Loading Error com retry
export const LoadingError: React.FC<{
  resource?: string;
  onRetry?: () => void;
}> = ({ resource = "dados", onRetry }) => {
  return (
    <ErrorState
      title="Erro ao Carregar"
      message={`Não foi possível carregar os ${resource}. Tente novamente.`}
      variant="error"
      showRetry={!!onRetry}
      onRetry={onRetry}
    />
  );
}; 