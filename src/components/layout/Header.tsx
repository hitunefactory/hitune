import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  Bell,
  Search,
  Plus,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Layers,
  CheckCircle,
  CheckCheck,
  Check,
  Trash2,
  RotateCcw,
  User,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { dataService } from '../../services/dataService'
import { NotificationItem, UserRole } from '../../types/database'
import { ROLE_LABELS_BN } from '../../lib/constants'
import { cn, formatBengaliNumber } from '../../lib/utils'
import { UserAvatar } from '../ui/UserAvatar'
import { ProfileModal } from '../profile/ProfileModal'
import { InstallAppButton } from '../pwa/InstallAppButton'

interface HeaderProps {
  setMobileOpen: (open: boolean) => void
}

export const Header: React.FC<HeaderProps> = ({ setMobileOpen }) => {
  const { user, currentRole, availableRoles, switchRole, logout, hasRole } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const actionsMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false)
        setShowRoleMenu(false)
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCloudSync = async () => {
    setSyncing(true)
    setSyncMessage('')
    try {
      const res = await dataService.syncAllToCloud()
      window.dispatchEvent(new CustomEvent('hitune:data-synced', { detail: res }))
      await loadNotifications()
      setSyncMessage(res.syncedOrdersCount > 0 ? `${res.syncedOrdersCount} টি অর্ডার ক্লাউডে সিঙ্ক হয়েছে` : 'ক্লাউড সিঙ্ক সফল')
      setTimeout(() => setSyncMessage(''), 3000)
    } catch (err) {
      console.error('Cloud sync error:', err)
      setSyncMessage('সিঙ্ক ব্যর্থ হয়েছে')
      setTimeout(() => setSyncMessage(''), 3000)
    } finally {
      setSyncing(false)
    }
  }

  const loadNotifications = async () => {
    if (!user) return
    const list = await dataService.getNotifications(user.id, currentRole)
    setNotifications(list)
  }

  useEffect(() => {
    loadNotifications()
    const timer = setInterval(loadNotifications, 5000)
    const handleRefresh = () => {
      loadNotifications()
    }
    window.addEventListener('hitune:notifications-updated', handleRefresh)
    window.addEventListener('hitune:data-synced', handleRefresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('hitune:notifications-updated', handleRefresh)
      window.removeEventListener('hitune:data-synced', handleRefresh)
    }
  }, [user, currentRole])

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const readCount = notifications.filter((n) => n.is_read).length

  const handleMarkAsRead = async (id: string, link?: string | null) => {
    await dataService.markNotificationAsRead(id)
    loadNotifications()
    if (link) {
      setShowNotifMenu(false)
      // Smart navigation: if target route is department-restricted and user lacks access, redirect to /orders/:id
      if (link.startsWith('/video') && !hasRole(['SUPER_ADMIN', 'VIDEO_EDITOR'])) {
        const urlParams = new URLSearchParams(link.split('?')[1] || '')
        const orderId = urlParams.get('orderId')
        if (orderId) {
          navigate(`/orders/${orderId}`)
          return
        }
      }
      if (link.startsWith('/audio') && !hasRole(['SUPER_ADMIN', 'AUDIO_DESIGNER'])) {
        const urlParams = new URLSearchParams(link.split('?')[1] || '')
        const orderId = urlParams.get('orderId')
        if (orderId) {
          navigate(`/orders/${orderId}`)
          return
        }
      }
      navigate(link)
    }
  }

  const handleToggleReadStatus = async (e: React.MouseEvent, notif: NotificationItem) => {
    e.stopPropagation()
    if (notif.is_read) {
      await dataService.markNotificationAsUnread(notif.id)
    } else {
      await dataService.markNotificationAsRead(notif.id)
    }
    loadNotifications()
  }

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await dataService.deleteNotification(id)
    loadNotifications()
  }

  const handleClearRead = async () => {
    if (!user) return
    await dataService.clearReadNotifications(user.id)
    loadNotifications()
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    await dataService.markAllNotificationsAsRead(user.id)
    loadNotifications()
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/orders?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0b1120]/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 lg:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="মেনু খুলুন"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile Search Toggle */}
        <button
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="খুঁজুন"
        >
          <Search className="h-4 w-4" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="অর্ডার নম্বর, ক্লায়েন্টের নাম বা ফোন দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
          />
        </form>
      </div>

      {/* Mobile Search Bar Popup */}
      {showMobileSearch && (
        <div className="absolute top-16 left-0 right-0 p-3 bg-[#0b1120] border-b border-slate-800 sm:hidden z-40 animate-in slide-in-from-top-2">
          <form
            onSubmit={(e) => {
              handleSearchSubmit(e)
              setShowMobileSearch(false)
            }}
            className="relative w-full"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="অর্ডার নম্বর বা ক্লায়েন্টের নাম..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
        </div>
      )}

      {/* Right: Actions, Notifications, Role Switcher, Profile */}
      <div ref={actionsMenuRef} className="flex items-center gap-1.5 sm:gap-2.5">
        <InstallAppButton variant="header" />

        {/* Quick Add Order Button - visible on mobile as icon, with label on sm */}
        {hasRole(['SUPER_ADMIN', 'ORDER_MANAGER']) && (
          <Link
            to="/orders/new"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/30 transition transform active:scale-95"
            title="নতুন অর্ডার তৈরি করুন"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">নতুন অর্ডার</span>
          </Link>
        )}

        {/* Role Switcher Pill (if user has multiple roles) */}
        {availableRoles.length > 1 && (
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu)
                setShowNotifMenu(false)
                setShowUserMenu(false)
              }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 transition"
            >
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span className="font-semibold text-white">
                {ROLE_LABELS_BN[currentRole]?.title || currentRole}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl p-2 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                  ভূমিকা পরিবর্তন করুন
                </div>
                <div className="mt-1 space-y-1">
                  {availableRoles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r as UserRole)
                        setShowRoleMenu(false)
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left',
                        currentRole === r
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      )}
                    >
                      <span>{ROLE_LABELS_BN[r as UserRole]?.title || r}</span>
                      {currentRole === r && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Real-time Cloud Auto-Sync Indicator */}
        <div className="relative">
          <div
            onClick={handleCloudSync}
            className="cursor-pointer px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/40 transition flex items-center gap-2 text-xs"
            title="স্বয়ংক্রিয় রিয়েল-টাইম ক্লাউড সিঙ্ক সক্রিয় (কোনো ক্লিক ছাড়াই ডিভাইস টু ডিভাইস অটো আপডেট)"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-emerald-400/90 hidden sm:inline">
              অটো সিঙ্ক সক্রিয়
            </span>
            <RefreshCw className={cn("h-3 w-3 text-slate-400", syncing && "animate-spin text-emerald-400")} />
          </div>

          {syncMessage && (
            <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-emerald-950/95 border border-emerald-500/50 rounded-xl text-[11px] text-emerald-300 shadow-xl whitespace-nowrap z-50 animate-in fade-in">
              ✓ {syncMessage}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title={theme === 'dark' ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              const next = !showNotifMenu
              setShowNotifMenu(next)
              setShowRoleMenu(false)
              setShowUserMenu(false)
              if (next) loadNotifications()
            }}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="বিজ্ঞপ্তি"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {formatBengaliNumber(unreadCount)}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-900/70">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">বিজ্ঞপ্তি</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold">
                      {formatBengaliNumber(unreadCount)} টি নতুন
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      সব পঠিত
                    </button>
                  )}
                  {readCount > 0 && (
                    <button
                      onClick={handleClearRead}
                      className="text-[11px] text-slate-400 hover:text-rose-400 font-medium cursor-pointer"
                      title="পঠিত বিজ্ঞপ্তি মুছে ফেলুন"
                    >
                      পঠিত মুছুন
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    কোনো বিজ্ঞপ্তি নেই
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id, n.link)}
                      className={cn(
                        'p-3 transition cursor-pointer flex items-start gap-2.5 border-l-4 group',
                        !n.is_read
                          ? 'bg-blue-950/35 hover:bg-blue-950/55 border-l-blue-500'
                          : 'bg-slate-900/30 hover:bg-slate-800/40 border-l-transparent opacity-65 hover:opacity-100'
                      )}
                    >
                      {/* Read vs Unread Visual Indicator */}
                      {!n.is_read ? (
                        <div className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 bg-blue-400 ring-4 ring-blue-500/20" />
                      ) : (
                        <CheckCheck className="h-3.5 w-3.5 mt-1 shrink-0 text-emerald-500/80" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'text-xs truncate',
                              !n.is_read ? 'font-bold text-white' : 'font-medium text-slate-300'
                            )}
                          >
                            {n.title}
                          </span>
                          {!n.is_read ? (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold shrink-0">
                              নতুন
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/90 text-[9px] font-semibold shrink-0">
                              পঠিত
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">{n.message}</div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-slate-500">
                            {new Date(n.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleToggleReadStatus(e, n)}
                              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition cursor-pointer"
                              title={n.is_read ? 'অপঠিত করুন' : 'পঠিত করুন'}
                            >
                              {n.is_read ? <RotateCcw className="h-3 w-3" /> : <Check className="h-3 w-3 text-blue-400" />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteNotification(e, n.id)}
                              className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800/80 text-[10px] text-slate-500 text-center">
                  পঠিত বিজ্ঞপ্তি রাত ১২টার পর স্বয়ংক্রিয়ভাবে মুছে যাবে (অপঠিতগুলো থাকবে)
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu)
              setShowNotifMenu(false)
              setShowRoleMenu(false)
            }}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition"
          >
            <UserAvatar
              src={user?.avatar_url}
              name={user?.bengali_name || user?.full_name}
              size="sm"
            />
            <span className="hidden sm:inline text-xs font-semibold text-white max-w-[120px] truncate">
              {user?.bengali_name || user?.full_name || 'স্টাফ'}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl p-2 z-50">
              <div className="p-3 border-b border-slate-800/80">
                <div className="text-sm font-bold text-white">{user?.bengali_name || user?.full_name}</div>
                <div className="text-xs text-slate-400 truncate">{user?.email}</div>
                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {ROLE_LABELS_BN[currentRole]?.title}
                </div>
              </div>

              <div className="pt-2 space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    setShowProfileModal(true)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 transition text-left"
                >
                  <User className="h-3.5 w-3.5 text-blue-400" />
                  <span>আমার প্রোফাইল ও ছবি পরিবর্তন</span>
                </button>

                <button
                  onClick={() => {
                    logout()
                    setShowUserMenu(false)
                    navigate('/login')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>লগআউট</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  )
}
