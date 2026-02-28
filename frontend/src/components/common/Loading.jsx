import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ size = 'md', text = 'Đang tải...', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };
  
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} text-primary-500 animate-spin`} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }
  
  return <div className="flex items-center justify-center py-12">{content}</div>;
};

export default Loading;