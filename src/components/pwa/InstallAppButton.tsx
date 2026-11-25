import React from 'react'
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { useBackOverlay } from '../../hooks/useBackOverlay'
import { cn } from '../../lib/utils'

interface InstallAppButtonProps {
  variant?: 'header' | 'sidebar' | 'login'
  onAction?: () => void
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  variant = 'header',
  onAction,
}) => {
  const { canInstall, showIosGuide, setShowIosGuide, triggerInstall } = usePwaInstall()

  useBackOverlay(showIosGuide, () => setShowIosGuide(false))

  if (!canInstall) return null

  const handleClick = async () => {
    await triggerInstall()
    onAction?.()
  }

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition cursor-pointer active:scale-95"
          title="ডেক্সটপ বা মোবাইলে অ্যাপ হিসেবে ইন্সটল করুন"
        >
          <Download className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden md:inline">অ্যাপ ইন্সটল</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold',
            'bg-gradient-to-r from-blue-600/25 to-emerald-600/20 hover:from-blue-600/35 hover:to-emerald-600/30',
            'border border-blue-500/40 text-blue-200 transition cursor-pointer active:scale-95'
          )}
        >
          <Download className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>অ্যাপ হিসেবে ইন্সটল করুন</span>
        </button>
      )}

      {variant === 'login' && (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-blue-500/30 text-xs font-semibold text-blue-300 shadow-lg transition cursor-pointer active:scale-95"
        >
          <Smartphone className="h-4 w-4 text-emerald-400" />
          <span>কম্পিউটার বা মোবাইলে অ্যাপ ইন্সটল করুন</span>
        </button>
      )}

      {/* iPhone / iPad Safari Add to Home Screen Modal */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">আইফোনে অ্যাপ ইন্সটল</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <Share className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <span>১. Safari ব্রাউজারের নিচে বা উপরে থাকা <strong>Share (↑)</strong> আইকনে ট্যাপ করুন।</span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <PlusSquare className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>২. নিচে স্ক্রল করে <strong>&quot;Add to Home Screen&quot;</strong> চাপুন এবং <strong>Add</strong> করুন।</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </>
  )
}
