import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '../../lib/utils'
import { dataService } from '../../services/dataService'

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Auto-sync on window focus or visibility change (switching tabs or opening mobile browser)
  useEffect(() => {
    let lastSyncTime = 0
    const triggerSync = async () => {
      const now = Date.now()
      // Throttle sync to at most once every 10 seconds on focus
      if (now - lastSyncTime < 10000) return
      lastSyncTime = now

      try {
        await dataService.getOrders()
        window.dispatchEvent(new CustomEvent('hitune:data-synced'))
      } catch (err) {
        console.warn('Auto sync on focus notice:', err)
      }
    }

    const onFocus = () => triggerSync()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') triggerSync()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
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

        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>

        {/* Bengali Studio Footer */}
        <footer className="py-4 px-6 border-t border-slate-800/80 bg-[#0b1120]/60 text-center text-xs text-slate-500">
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
    </div>
  )
}
