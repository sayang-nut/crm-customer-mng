import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  action,
  hover = false,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${className}`}>
      {(title || subtitle || action) && (
        <div className="card-header flex items-start justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-dark-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      
      <div className={`card-body ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default Card;