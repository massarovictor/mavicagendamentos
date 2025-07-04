import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  colorClass?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  colorClass = 'bg-blue-500',
  trend,
  onClick
}) => {
  const lightColorClass = colorClass.replace('-500', '-500');
  const textColorClass = 'text-white';

  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${lightColorClass}`}>
          <Icon className={`h-5 w-5 ${textColorClass}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">
            {description}
          </p>
          {trend && (
            <div className={`text-xs font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface StatsGridProps {
  stats: Array<Omit<StatsCardProps, 'key'>>;
  columns?: 2 | 3 | 4;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, columns = 4 }) => {
  const gridClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
}; 