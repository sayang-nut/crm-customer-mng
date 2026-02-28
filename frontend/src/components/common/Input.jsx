import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

const Input = forwardRef(
  (
    {
      label,
      type = 'text',
      error,
      icon: Icon,
      required = false,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="form-group">
        {label && (
          <label className={`label ${required ? 'label-required' : ''}`}>
            {label}
          </label>
        )}
        
        <div className="relative">
          {Icon && (
            <div className="input-icon">
              <Icon className="w-5 h-5" />
            </div>
          )}
          
          <input
            ref={ref}
            type={type}
            className={`input ${Icon ? 'input-with-icon' : ''} ${
              error ? 'input-error' : ''
            } ${className}`}
            {...props}
          />
          
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          )}
        </div>
        
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;