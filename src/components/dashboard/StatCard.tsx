import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn, formatBengaliNumber } from '../../lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  subValue?: string
  icon: LucideIcon
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan'
  isCurrency?: boolean
  onClick?: () => void
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  icon: Icon,
  colorScheme = 'blue',
  isCurrency = false,
  onClick,
}) => {
  const colorStyles = {
    blue: {
      bg: 'from-blue-600/10 to-blue-500/5',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/20 text-blue-400',
      text: 'text-blue-400',
    },
    emerald: {
      bg: 'from-emerald-600/10 to-emerald-500/5',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      text: 'text-emerald-400',
    },
    amber: {
      bg: 'from-amber-600/10 to-amber-500/5',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/20 text-amber-400',
      text: 'text-amber-400',
    },
    rose: {
      bg: 'from-rose-600/10 to-rose-500/5',
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/20 text-rose-400',
      text: 'text-rose-400',
    },
    purple: {
      bg: 'from-purple-600/10 to-purple-500/5',
      border: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/20 text-purple-400',
      text: 'text-purple-400',
    },
    cyan: {
      bg: 'from-cyan-600/10 to-cyan-500/5',
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/20 text-cyan-400',
      text: 'text-cyan-400',
    },
  }

  const currentTheme = colorStyles[colorScheme]

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 sm:p-4 rounded-2xl bg-gradient-to-br bg-slate-900/80 border transition-all duration-200 relative overflow-hidden group shadow-lg',
        currentTheme.bg,
        currentTheme.border,
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.97]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400 leading-tight block truncate">
            {title}
          </span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-baseline gap-1 truncate">
            {isCurrency ? (
              <>
                <span className="text-base sm:text-lg font-semibold text-slate-400">৳</span>
                <span className="truncate">{formatBengaliNumber(value)}</span>
              </>
            ) : (
              <span className="truncate">{formatBengaliNumber(value)}</span>
            )}
          </div>
          {subValue && (
            <span className="text-[10px] sm:text-[11px] text-slate-400 block pt-0.5 truncate">
              {subValue}
            </span>
          )}
        </div>

        <div className={cn('p-2 sm:p-2.5 rounded-xl shrink-0 transition-transform group-hover:rotate-6', currentTheme.iconBg)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  )
}
