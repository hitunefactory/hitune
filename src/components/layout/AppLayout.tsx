import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '../../lib/utils'

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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
