import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ label, children, ...props }) => {
  return (
    <div>
      <label htmlFor={props.name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={props.name}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};