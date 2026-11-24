import React from 'react'
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '../../types/database'
import { ShieldAlert, Eye, LayoutDashboard, FolderKanban } from 'lucide-react'
import { ROLE_LABELS_BN } from '../../lib/constants'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, hasRole, currentRole, isLoading } = useAuth()
  const location = useLocation()

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
    const searchParams = new URLSearchParams(location.search)
    const orderId = searchParams.get('orderId')
    const currentRoleName = currentRole ? ROLE_LABELS_BN[currentRole]?.title || currentRole : 'আপনার বর্তমান ভূমিকা'

    return (
      <div className="p-6 sm:p-8 text-center bg-slate-900/80 border border-slate-800 rounded-3xl max-w-lg mx-auto my-12 shadow-2xl animate-in fade-in duration-200">
        <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">অনুমতি নেই</h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
          আপনি বর্তমানে <strong className="text-amber-400">{currentRoleName}</strong> হিসেবে লগইন আছেন। এই বিভাগটি দেখার মতো প্রয়োজনীয় পারমিশন এই আইডিতে নেই।
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
          {orderId && (
            <Link
              to={`/orders/${orderId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Eye className="h-4 w-4" />
              <span>অর্ডারের বিস্তারিত দেখুন</span>
            </Link>
          )}
          <Link
            to="/orders"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <FolderKanban className="h-4 w-4" />
            <span>অর্ডার তালিকা</span>
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 transition cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>ড্যাশবোর্ড</span>
          </Link>
        </div>
      </div>
    )
  }

  return <Outlet />
}
