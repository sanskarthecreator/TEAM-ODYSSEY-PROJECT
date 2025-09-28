
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', ...props }) => {
  const baseClasses = 'font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
    icon: 'bg-white bg-opacity-80 text-gray-700 hover:bg-opacity-100 hover:text-gray-900 focus:ring-blue-500 shadow-md',
  };

  const sizeClasses = {
      md: 'py-2 px-4 text-base',
      lg: 'py-3 px-6 text-lg',
  }

  if (variant === 'icon') {
      return (
        <button className={`${baseClasses} ${variantClasses.icon} h-10 w-10`} {...props}>
          {children}
        </button>
      );
  }

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`} {...props}>
      {children}
    </button>
  );
};