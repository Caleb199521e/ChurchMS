import React from 'react';

export default function LoadingSpinner({ 
  size = 'md',  // sm, md, lg
  text = 'Loading...',
  fullScreen = false,
  overlay = false
}) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} border-4 border-brand border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-gray-600 text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
}
