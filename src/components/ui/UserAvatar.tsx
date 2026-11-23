import React from 'react'
import { User } from 'lucide-react'
import { cn } from '../../lib/utils'

interface UserAvatarProps {
  src?: string | null
  name?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-20 w-20 text-2xl',
  }

  // Get initial character from Bengali or English name
  const getInitial = (n?: string | null) => {
    if (!n) return ''
    const trimmed = n.trim()
    return trimmed.charAt(0).toUpperCase()
  }

  const initial = getInitial(name)

  // If valid image src is present and NOT the legacy unsplash default
  const hasValidImage = src && !src.includes('photo-1534528741775-53994a69daeb') && !src.includes('unsplash.com/photo-')

  if (hasValidImage) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={cn(
          'rounded-full object-cover ring-2 ring-blue-500/40 shrink-0',
          sizeClasses[size],
          className
        )}
      />
    )
  }

  // Stylish initials gradient fallback
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 text-white font-bold flex items-center justify-center shrink-0 ring-2 ring-blue-500/40 select-none shadow-md',
        sizeClasses[size],
        className
      )}
    >
      {initial ? <span>{initial}</span> : <User className="h-1/2 w-1/2 opacity-80" />}
    </div>
  )
}
