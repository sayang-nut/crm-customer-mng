import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color = 'primary',
  children 
}) => {
  const colorClasses = {
    primary: 'bg-primary-100 border-primary-200 text-primary-700',
    success: 'bg-green-100 border-green-200 text-green-700',
    warning: 'bg-yellow-100 border-yellow-200 text-yellow-700',
    danger: 'bg-red-100 border-red-200 text-red-700',
    info: 'bg-blue-100 border-blue-200 text-blue-700',
    accent: 'bg-accent-100 border-accent-200 text-accent-700',
  };

  const changeIcon = changeType === 'up' ? TrendingUp : TrendingDown;

  return (
    <div className="group cursor-pointer border border-gray-200 hover:border-gray-300 
                    hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 
                    rounded-xl bg-white p-6 h-full">
      
      <div className="flex items-start justify-between gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-700 mb-3 line-clamp-2">
            {title}
          </p>
          
          <p className="text-3xl font-black text-dark-900 mb-4 leading-tight">
            {value}
          </p>
          
          {/* Change indicator */}
          {change && (
            <div className={`flex items-center gap-1.5 text-sm font-semibold ${
              changeType === 'up' 
                ? 'text-green-700' 
                : 'text-red-700'
            }`}>
              <changeIcon className="w-4 h-4 -mt-0.5" />
              <span>{change}</span>
              <span className="text-gray-600 font-normal">vs tháng trước</span>
            </div>
          )}
          
          {/* Children (badges) */}
          {children && (
            <div className="mt-3 space-y-1">{children}</div>
          )}
        </div>
        
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border
                        ${colorClasses[color]}`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;