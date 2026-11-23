import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '../../types/database'
import { ShieldAlert } from 'lucide-react'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, hasRole, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">লোডিং হচ্ছে...</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-3xl max-w-lg mx-auto my-12">
        <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">অনুমতি নেই</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          দুঃখিত, এই বিভাগটি দেখার মতো প্রয়োজনীয় পারমিশন আপনার বর্তমান অ্যাকাউন্টে নেই। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন অথবা ভূমিকা পরিবর্তন করুন।
        </p>
      </div>
    )
  }

  return <Outlet />
}
