import React from 'react';
import { cn } from '@/lib/utils';
import MavicCompleto from './mavic-completo';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  className = '', 
  showSubtitle = false
}) => {
  const sizeClasses = {
    sm: {
      logoSize: 100,
      subtitleText: 'text-xs'
    },
    md: {
      logoSize: 140,
      subtitleText: 'text-sm'
    },
    lg: {
      logoSize: 180,
      subtitleText: 'text-base'
    },
    xl: {
      logoSize: 220,
      subtitleText: 'text-lg'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Logo completo da MAVIC */}
      <MavicCompleto 
        size={currentSize.logoSize} 
        className="text-gray-800" 
      />
      
      {/* Subtitle apenas quando solicitado */}
      {showSubtitle && (
        <p 
          className={cn(
            currentSize.subtitleText,
            'text-gray-600 font-medium tracking-wide mt-2',
            'drop-shadow-sm'
          )}
        >
          Sistema de Agendamento de Espaços
        </p>
      )}
    </div>
  );
};

export default BrandLogo; 