import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Headphones,
  Video,
  CheckCircle2,
  Truck,
  Wallet,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Music2,
  Sparkles,
  X,
  LogOut,
  Layers,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ROLE_LABELS_BN } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { UserAvatar } from '../ui/UserAvatar'
import { UserRole } from '../../types/database'

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, currentRole, availableRoles, switchRole, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const [showRoleSelect, setShowRoleSelect] = useState(false)

  const navItems = [
    {
      title: 'ড্যাশবোর্ড',
      path: '/',
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      title: 'অর্ডার তালিকা',
      path: '/orders',
      icon: FolderKanban,
      allowed: true,
    },
    {
      title: 'নতুন অর্ডার তৈরি',
      path: '/orders/new',
      icon: PlusCircle,
      allowed: hasRole(['SUPER_ADMIN', 'ORDER_MANAGER']),
      highlight: true,
    },
    {
      title: 'অডিও বিভাগ',
      path: '/audio',
      icon: Headphones,
      allowed: hasRole(['SUPER_ADMIN', 'AUDIO_DESIGNER']),
    },
    {
      title: 'ভিডিও বিভাগ',
      path: '/video',
      icon: Video,
      allowed: hasRole(['SUPER_ADMIN', 'VIDEO_EDITOR']),
    },
    {
      title: 'কোয়ালিটি কন্ট্রোল',
      path: '/quality-control',
      icon: CheckCircle2,
      allowed: hasRole(['SUPER_ADMIN', 'QUALITY_CONTROLLER']),
    },
    {
      title: 'ডেলিভারি ব্যবস্থাপনা',
      path: '/delivery',
      icon: Truck,
      allowed: hasRole(['SUPER_ADMIN', 'ORDER_MANAGER', 'DELIVERY_MANAGER']),
    },
    {
      title: 'হিসাব ও পেমেন্ট',
      path: '/accounting',
      icon: Wallet,
      allowed: hasRole(['SUPER_ADMIN', 'ACCOUNTANT', 'ORDER_MANAGER']),
    },
    {
      title: 'রিপোর্ট ও বিশ্লেষণ',
      path: '/reports',
      icon: BarChart3,
      allowed: hasRole(['SUPER_ADMIN', 'ORDER_MANAGER', 'ACCOUNTANT']),
    },
    {
      title: 'টিম ও ইউজার',
      path: '/staff',
      icon: Users,
      allowed: hasRole('SUPER_ADMIN'),
    },
    {
      title: 'সিস্টেম সেটিংস',
      path: '/settings',
      icon: Settings,
      allowed: hasRole('SUPER_ADMIN'),
    },
  ]

  const roleInfo = ROLE_LABELS_BN[currentRole] || ROLE_LABELS_BN.SUPER_ADMIN

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0b1120] border-r border-slate-800 text-slate-300 transition-all duration-300 select-none shadow-2xl',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-[#070b14]/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 min-w-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30">
              <Music2 className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-white text-base leading-tight flex items-center gap-1.5">
                  HI TUNE STUDIO
                </span>
                <span className="text-[11px] text-blue-400/90 font-medium">
                  স্মার্ট স্টুডিও ম্যানেজমেন্ট
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center h-7 w-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={collapsed ? 'প্রসারিত করুন' : 'সংকুচিত করুন'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex items-center justify-center h-8 w-8 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition"
            title="মেনু বন্ধ করুন"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current Active Role Badge */}
        {!collapsed && (
          <div className="mx-3 my-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex flex-col truncate">
                  <span className="text-[11px] text-slate-400 font-medium leading-none">বর্তমান ভূমিকা:</span>
                  <span className="text-xs font-semibold text-white mt-1 truncate">
                    {roleInfo.title}
                  </span>
                </div>
              </div>
              {availableRoles.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setShowRoleSelect(!showRoleSelect)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold cursor-pointer"
                >
                  পরিবর্তন
                </button>
              ) : (
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', roleInfo.color)}>
                  অনুমোদিত
                </span>
              )}
            </div>

            {/* Role dropdown inside sidebar on mobile */}
            {showRoleSelect && availableRoles.length > 1 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                {availableRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r as UserRole)
                      setShowRoleSelect(false)
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition',
                      currentRole === r ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    )}
                  >
                    <span>{ROLE_LABELS_BN[r as UserRole]?.title || r}</span>
                    {currentRole === r && <span className="text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
          {navItems
            .filter((item) => item.allowed)
            .map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                        : item.highlight
                        ? 'bg-blue-950/40 border border-blue-500/30 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100',
                      collapsed && 'justify-center px-0'
                    )
                  }
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className={cn('h-5 w-5 shrink-0 transition-transform group-hover:scale-110')} />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                  {item.highlight && !collapsed && (
                    <Sparkles className="h-3.5 w-3.5 text-blue-400 ml-auto shrink-0 animate-spin-slow" />
                  )}
                </NavLink>
              )
            })}
        </nav>

        {/* Bottom Studio Location & Staff Avatar */}
        <div className="p-3 border-t border-slate-800 bg-[#070b14]/70">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <UserAvatar
                  src={user?.avatar_url}
                  name={user?.bengali_name || user?.full_name}
                  size="md"
                />
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-white truncate">
                    {user?.bengali_name || user?.full_name}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    জামালপুর সদর, বাংলাদেশ
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout()
                  setMobileOpen(false)
                  navigate('/login')
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                title="লগআউট করুন"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <UserAvatar
                src={user?.avatar_url}
                name={user?.bengali_name || user?.full_name}
                size="sm"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
