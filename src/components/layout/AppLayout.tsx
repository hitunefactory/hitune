import React, { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '../../lib/utils'
import { dataService } from '../../services/dataService'
import { useBackOverlay } from '../../hooks/useBackOverlay'
import { armMobileBackGuardIfNeeded, configureMobileNavigation } from '../../lib/mobileBack'

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showExitToast, setShowExitToast] = useState(false)
  const exitToastTimerRef = useRef<number | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Close mobile sidebar drawer on Android/browser hardware Back button
  useBackOverlay(mobileOpen, () => setMobileOpen(false))

  // Configure native-like mobile Back button navigation (deep-link fallback & double-back exit guard)
  useEffect(() => {
    configureMobileNavigation(location.pathname, {
      showExitToast: () => {
        setShowExitToast(true)
        if (exitToastTimerRef.current) {
          window.clearTimeout(exitToastTimerRef.current)
        }
        exitToastTimerRef.current = window.setTimeout(() => {
          setShowExitToast(false)
        }, 2300)
      },
      navigateHome: () => {
        navigate('/', { replace: true })
      },
    })
  }, [location.pathname, navigate])

  useEffect(() => {
    const handleUserActivation = () => {
      armMobileBackGuardIfNeeded()
    }
    window.addEventListener('pointerdown', handleUserActivation, { passive: true, capture: true })
    window.addEventListener('keydown', handleUserActivation, { passive: true, capture: true })
    return () => {
      window.removeEventListener('pointerdown', handleUserActivation, true)
      window.removeEventListener('keydown', handleUserActivation, true)
      if (exitToastTimerRef.current) {
        window.clearTimeout(exitToastTimerRef.current)
      }
    }
  }, [])

  // 100% AUTOMATIC REAL-TIME CLOUD SYNC ENGINE
  useEffect(() => {
    // 1. Initial background sync on app load (runs once silently)
    dataService.syncAllToCloud().then(() => {
      window.dispatchEvent(new CustomEvent('hitune:data-synced'))
    }).catch(() => {})

    // 2. Real-time WebSocket connection to Supabase (only fires when database data actually changes)
    const unsubscribe = dataService.initRealtimeSubscription(() => {
      window.dispatchEvent(new CustomEvent('hitune:data-synced'))
    })

    // 3. Sync on tab focus or screen unlock (Mobile / PC) - throttled to max once every 30 seconds
    let lastFocusSync = 0
    const onFocus = () => {
      const now = Date.now()
      if (now - lastFocusSync < 30000) return
      lastFocusSync = now

      dataService.getOrders().then(() => {
        window.dispatchEvent(new CustomEvent('hitune:data-synced'))
      }).catch(() => {})
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onFocus()
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      unsubscribe()
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 min-w-0',
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        <Header setMobileOpen={setMobileOpen} />

        <main className="flex-1 p-3 pb-8 sm:p-4 sm:pb-8 lg:p-6 max-w-7xl w-full mx-auto space-y-6 min-w-0">
          <Outlet />
        </main>

        {/* Bengali Studio Footer (Desktop only — hidden on mobile for clean app feel) */}
        <footer className="hidden lg:block py-4 px-6 border-t border-slate-800/80 bg-[#0b1120]/60 text-center text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>
              &copy; ২০২৬ <strong className="text-slate-400">HI TUNE STUDIO</strong> — জামালপুর, বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।
            </span>
            <span className="text-[11px] text-blue-400/80">
              স্মার্ট অর্ডার ও প্রোডাকশন ম্যানেজমেন্ট প্ল্যাটফর্ম v1.0
            </span>
          </div>
        </footer>
      </div>

      {/* Mobile Double-Back-to-Exit Native Toast */}
      {showExitToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-full bg-slate-900/95 border border-slate-700/80 text-white text-xs font-medium shadow-2xl backdrop-blur-md whitespace-nowrap pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          বের হতে আবার ব্যাক বাটন চাপুন
        </div>
      )}
    </div>
  )
}
