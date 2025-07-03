import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FormatUtils } from '@/utils/validations';

interface StatusBadgeProps {
  status: 'pendente' | 'aprovado' | 'rejeitado';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <Badge 
      variant="secondary" 
      className={`${FormatUtils.getStatusColor(status)} ${className}`}
    >
      {FormatUtils.getStatusLabel(status)}
    </Badge>
  );
}; 