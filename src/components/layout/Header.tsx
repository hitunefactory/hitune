import React, { useState, useEffect } from 'react'
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

interface HeaderProps {
  setMobileOpen: (open: boolean) => void
}

export const Header: React.FC<HeaderProps> = ({ setMobileOpen }) => {
  const { user, currentRole, availableRoles, switchRole, logout, hasRole } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

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
    const list = await dataService.getNotifications(user.id)
    setNotifications(list)
  }

  useEffect(() => {
    loadNotifications()
    const timer = setInterval(loadNotifications, 5000)
    return () => clearInterval(timer)
  }, [user])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleMarkAsRead = async (id: string, link?: string | null) => {
    await dataService.markNotificationAsRead(id)
    loadNotifications()
    if (link) {
      setShowNotifMenu(false)
      navigate(link)
    }
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
    <header className="sticky top-0 z-30 h-16 bg-[#0b1120]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <Menu className="h-5 w-5" />
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

      {/* Right: Actions, Notifications, Role Switcher, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Quick Add Order Button */}
        {hasRole(['SUPER_ADMIN', 'ORDER_MANAGER']) && (
          <Link
            to="/orders/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/30 transition transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন অর্ডার</span>
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
              <div className="absolute right-0 mt-2 w-56 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl p-2 z-50">
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

        {/* Cloud Sync Button */}
        <div className="relative">
          <button
            onClick={handleCloudSync}
            disabled={syncing}
            className={cn(
              "p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 text-xs",
              syncing && "text-blue-400"
            )}
            title="ক্লাউড ডাটা সিঙ্ক করুন (মোবাইল ও পিসি সংযোগ)"
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin text-blue-400")} />
            <span className="hidden md:inline text-[11px] font-medium">সিঙ্ক</span>
          </button>

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
              setShowNotifMenu(!showNotifMenu)
              setShowRoleMenu(false)
              setShowUserMenu(false)
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
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">বিজ্ঞপ্তিসমূহ</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
                      {formatBengaliNumber(unreadCount)} টি নতুন
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    সব পঠিত করুন
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    কোন নতুন বিজ্ঞপ্তি নেই
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id, n.link)}
                      className={cn(
                        'p-3 hover:bg-slate-800/60 transition cursor-pointer flex gap-3',
                        !n.is_read ? 'bg-blue-950/20' : 'opacity-70'
                      )}
                    >
                      <div className="h-2 w-2 rounded-full mt-1.5 shrink-0 bg-blue-500" />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-white">{n.title}</div>
                        <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">{n.message}</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {new Date(n.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
            <div className="absolute right-0 mt-2 w-64 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl p-2 z-50">
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
