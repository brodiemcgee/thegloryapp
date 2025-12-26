'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  trend?: number;
  icon: LucideIcon;
  color: 'purple' | 'blue' | 'red' | 'green' | 'orange' | 'gray';
  href?: string;
}

const colorClasses = {
  purple: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
    trend: 'text-purple-600',
  },
  blue: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
    trend: 'text-blue-600',
  },
  red: {
    bg: 'bg-red-100',
    icon: 'text-red-600',
    trend: 'text-red-600',
  },
  green: {
    bg: 'bg-green-100',
    icon: 'text-green-600',
    trend: 'text-green-600',
  },
  orange: {
    bg: 'bg-orange-100',
    icon: 'text-orange-600',
    trend: 'text-orange-600',
  },
  gray: {
    bg: 'bg-gray-100',
    icon: 'text-gray-600',
    trend: 'text-gray-600',
  },
};

export function StatsCard({
  title,
  value,
  trend,
  icon: Icon,
  color,
  href,
}: StatsCardProps) {
  const colors = colorClasses[color];

  const content = (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-6 transition-all',
        href && 'hover:border-gray-300 hover:shadow-sm cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatNumber(value)}
          </p>
          {trend !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 mt-2 text-sm',
                trend >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {trend >= 0 ? '+' : ''}
                {trend.toFixed(1)}%
              </span>
              <span className="text-gray-500">vs last week</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            colors.bg
          )}
        >
          <Icon className={cn('w-6 h-6', colors.icon)} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
