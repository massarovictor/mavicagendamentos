import React from 'react';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'absolute';
}

const Footer: React.FC<FooterProps> = ({ 
  className = '', 
  variant = 'default' 
}) => {
  const baseClasses = "text-xs text-gray-400 text-center";
  
  const variantClasses = {
    default: "py-4 border-t border-gray-100",
    minimal: "py-2",
    absolute: "absolute bottom-4 left-0 right-0"
  };

  return (
    <footer className={cn(baseClasses, variantClasses[variant], className)}>
      <p>
        © {new Date().getFullYear()} MAVIC - Todos os direitos reservados{' '}
        <span className="font-medium">Massaro Victor</span>
      </p>
    </footer>
  );
};

export default Footer; 