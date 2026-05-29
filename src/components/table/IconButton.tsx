import React from 'react';

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ 
  children, 
  onClick, 
  ...props 
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
      }}
      {...props}
      className={`icon-button ${props.className || ''}`}
    >
      {children}
    </button>
  );
};
