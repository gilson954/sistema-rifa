import React from 'react';
import * as flags from 'country-flag-icons/react/3x2';

interface FlagIconProps {
  countryCode: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  theme?: 'claro' | 'escuro' | 'escuro-preto';
}

const FlagIcon: React.FC<FlagIconProps> = ({
  countryCode,
  size = 'md',
  className = '',
  theme
}) => {
  const sizeClasses = {
    sm: 'w-5 h-4',
    md: 'w-6 h-5',
    lg: 'w-8 h-6'
  };

  const getBorderClasses = () => {
    if (!theme) {
      return 'ring-1 ring-gray-200 dark:ring-gray-600';
    }

    if (theme === 'claro') {
      return 'ring-1 ring-gray-200';
    }

    return 'ring-1 ring-gray-600';
  };

  const FlagComponent = flags[countryCode as keyof typeof flags];

  if (!FlagComponent) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
      >
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {countryCode}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-md overflow-hidden ${getBorderClasses()} shadow-sm flex-shrink-0 ${className}`}
      style={{ display: 'inline-block' }}
    >
      <FlagComponent className="w-full h-full object-cover" />
    </div>
  );
};

export default FlagIcon;
