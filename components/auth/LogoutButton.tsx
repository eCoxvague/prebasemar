'use client';

import { useAuth } from '@/lib/context/AuthContext';

interface LogoutButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'text';
}

export function LogoutButton({ className = '', variant = 'text' }: LogoutButtonProps) {
  const { logout } = useAuth();

  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors';
  
  const variantStyles = {
    primary: 'bg-red-600 text-white hover:bg-red-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    text: 'text-gray-700 hover:bg-gray-100',
  };

  return (
    <button
      onClick={logout}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      Sign out
    </button>
  );
}
