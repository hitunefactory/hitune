import React from 'react'
import { OrderOverallStatus, OrderPriority, PaymentStatus } from '../../types/database'
import { STATUS_MAP_BN, PRIORITY_MAP_BN, PAYMENT_STATUS_MAP_BN } from '../../lib/constants'
import { cn } from '../../lib/utils'

interface StatusBadgeProps {
  status: OrderOverallStatus
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const conf = STATUS_MAP_BN[status] || {
    label: status,
    badge: 'bg-slate-700 text-slate-300 border-slate-600',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border font-medium whitespace-nowrap',
        conf.badge,
        className
      )}
    >
      {conf.label}
    </span>
  )
}

interface PriorityBadgeProps {
  priority: OrderPriority
  className?: string
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className }) => {
  const conf = PRIORITY_MAP_BN[priority] || PRIORITY_MAP_BN.NORMAL

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border font-medium whitespace-nowrap',
        conf.badge,
        className
      )}
    >
      {conf.label}
    </span>
  )
}

interface PaymentBadgeProps {
  status: PaymentStatus
  className?: string
}

export const PaymentBadge: React.FC<PaymentBadgeProps> = ({ status, className }) => {
  const conf = PAYMENT_STATUS_MAP_BN[status] || PAYMENT_STATUS_MAP_BN.UNPAID

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border font-medium whitespace-nowrap',
        conf.badge,
        className
      )}
    >
      {conf.label}
    </span>
  )
}
