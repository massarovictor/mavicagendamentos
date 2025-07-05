import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Badge } from './badge';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface StatItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  stats?: StatItem[];
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  breadcrumbs,
  stats,
  className = ""
}) => {
  return (
    <div className={`bg-background border-2 border-border rounded-lg ${className}`}>
      <div className="px-4 py-6 sm:px-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((item, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <span className="mx-2 text-muted-foreground">/</span>
                  )}
                  {item.href ? (
                    <a 
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span className="text-foreground font-medium">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Header Content */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {Icon && (
              <div className="p-2 rounded-lg bg-primary flex-shrink-0">
                <Icon className="w-6 h-6 text-primary-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {stats && stats.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-card rounded-lg p-4 hover:bg-accent transition-colors text-card-foreground"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground truncate">
                        {stat.label}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-2xl font-bold text-foreground">
                          {stat.value}
                        </p>
                        {stat.trend && (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              stat.trend.isPositive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {stat.trend.isPositive ? '+' : '-'}{Math.abs(stat.trend.value)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {IconComponent && (
                      <div className={`p-3 rounded-full ${stat.color || 'bg-primary'} flex-shrink-0`}>
                        <IconComponent className="w-6 h-6 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}; 