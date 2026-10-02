import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glow = false, ...props }) => {
  return (
    <div
      className={`${glow ? 'cockpit-card-glow' : 'cockpit-card'} p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
