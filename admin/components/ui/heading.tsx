// components/ui/heading.tsx
import React from 'react';
import { cn } from '@/lib/utils'; // if you're using a utility like clsx or cn()

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const Heading: React.FC<HeadingProps> = ({
  level = 1,
  children,
  className,
  ...props
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  const baseStyles = {
    1: 'text-4xl font-bold',
    2: 'text-3xl font-semibold',
    3: 'text-2xl font-semibold',
    4: 'text-xl font-medium',
    5: 'text-lg font-medium',
    6: 'text-base font-medium',
  };

  return (
    <Tag className={cn(baseStyles[level], className)} {...props}>
      {children}
    </Tag>
  );
};
