/**
 * PREMIUM BUTTON COMPONENT
 * Frosted glass aesthetic with authority
 */

import { cn } from '../utils/cn';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-2 font-semibold rounded-lg',
        'transition-all duration-200 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        
        // Variants
        variant === 'primary' && [
          'bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600',
          'text-white shadow-lg shadow-blue-500/30',
          'hover:shadow-xl hover:shadow-blue-500/40',
        ],
        variant === 'secondary' && [
          'bg-white/10 dark:bg-white/5 backdrop-blur-xl',
          'border border-white/20 dark:border-white/10',
          'text-gray-900 dark:text-white',
          'hover:bg-white/20 dark:hover:bg-white/10',
        ],
        variant === 'danger' && [
          'bg-gradient-to-br from-red-600 to-red-700',
          'text-white shadow-lg shadow-red-500/30',
          'hover:shadow-xl hover:shadow-red-500/40',
        ],
        variant === 'ghost' && [
          'text-gray-700 dark:text-gray-300',
          'hover:bg-gray-100 dark:hover:bg-white/5',
        ],
        
        // Sizes
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2.5 text-base',
        size === 'lg' && 'px-6 py-3.5 text-lg',
        
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
}
