import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Headphones,
  Upload,
  Play,
  CheckCircle,
  AlertCircle,
  FileAudio,
  ExternalLink,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  Phone,
  Shield,
  Layers,
} from 'lucide-react'
import { dataService } from '../../services/dataService'
import { Order, OrderOverallStatus } from '../../types/database'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useAuth } from '../../contexts/AuthContext'
import { formatBengaliNumber } from '../../lib/utils'
import { useBackOverlay } from '../../hooks/useBackOverlay'

export const AudioDeptPage: React.FC = () => {
  const { user, currentRole } = useAuth()
  const canAction = currentRole === 'AUDIO_DESIGNER' || (currentRole === 'SUPER_ADMIN' && user?.role === 'SUPER_ADMIN')
  const [searchParams] = useSearchParams()
  const targetOrderId = searchParams.get('orderId')
  const initialStatusFilter = searchParams.get('status') || 'ALL'

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter)
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'MINE'>('ALL')

  useEffect(() => {
    const st = searchParams.get('status')
    if (st) setStatusFilter(st)
  }, [searchParams])

  // Confirmation Modal
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null)
  const [completing, setCompleting] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  useBackOverlay(Boolean(confirmOrder) && !completing, () => setConfirmOrder(null))

  const loadAudioOrders = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const allOrders = await dataService.getOrders()
      // Filter for orders requiring audio
      const audioOrders = allOrders.filter((o) => o.audio_required)
      setOrders(audioOrders)
    } catch (err) {
      console.error('Failed to load audio orders:', err)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }

  useEffect(() => {
    loadAudioOrders()
    const onSync = () => {
      loadAudioOrders(true)
    }
    window.addEventListener('hitune:data-synced', onSync)
    return () => window.removeEventListener('hitune:data-synced', onSync)
  }, [])

  const handleStartWork = async (orderId: string) => {
    setActionLoadingId(orderId)
    try {
      await dataService.updateOrderStatus(orderId, 'AUDIO_IN_PROGRESS', 'অডিও ডিজাইনার কাজ শুরু করেছেন।')
      await loadAudioOrders()
    } catch (err) {
      console.error('Start work failed:', err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleClaimOrder = async (orderId: string) => {
    if (!user) return
    setActionLoadingId(orderId)
    try {
      await dataService.claimAudioOrder(orderId, user.id)
      await loadAudioOrders()
    } catch (err) {
      console.error('Claim audio order failed:', err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCompleteAudioWork = async (order: Order) => {
    setCompleting(true)
    try {
      const nextStatus: OrderOverallStatus = order.video_required ? 'VIDEO_PENDING' : 'READY_FOR_DELIVERY'
      await dataService.updateOrderStatus(order.id, nextStatus, 'অডিও কাজ সম্পন্ন করা হয়েছে।')
      dataService.notifyAudioCompleted(order)
      setConfirmOrder(null)
      await loadAudioOrders()
    } catch (err) {
      console.error('Complete audio failed:', err)
    } finally {
      setCompleting(false)
    }
  }

  const filteredOrders = orders.filter((o) => {
    // 1. Scope filter (All vs My Assigned Tasks)
    if (scopeFilter === 'MINE') {
      if (o.assigned_audio_staff_id !== user?.id) return false
    }

    // 2. Status filter
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'AUDIO_PENDING') {
      return o.overall_status === 'AUDIO_PENDING' || o.overall_status === 'NEW'
    }
    if (statusFilter === 'AUDIO_IN_PROGRESS') {
      return o.overall_status === 'AUDIO_IN_PROGRESS' || o.overall_status === 'AUDIO_REVISION'
    }
    if (statusFilter === 'COMPLETED') {
      return ['VIDEO_PENDING', 'VIDEO_IN_PROGRESS', 'VIDEO_SUBMITTED', 'VIDEO_QC', 'READY_FOR_DELIVERY', 'DELIVERED', 'AUDIO_QC'].includes(o.overall_status)
    }
    return o.overall_status === statusFilter
  })

  // Quick stats
  const inProgressCount = orders.filter((o) => o.overall_status === 'AUDIO_IN_PROGRESS' || o.overall_status === 'AUDIO_REVISION').length
  const revisionCount = orders.filter((o) => o.overall_status === 'AUDIO_REVISION').length
  const pendingCount = orders.filter((o) => o.overall_status === 'AUDIO_PENDING' || o.overall_status === 'NEW').length
  const completedCount = orders.filter((o) => ['VIDEO_PENDING', 'VIDEO_IN_PROGRESS', 'VIDEO_SUBMITTED', 'VIDEO_QC', 'READY_FOR_DELIVERY', 'DELIVERED', 'AUDIO_QC'].includes(o.overall_status)).length
  const myAssignedCount = user ? orders.filter((o) => o.assigned_audio_staff_id === user.id).length : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Headphones className="h-6 w-6 text-blue-500" />
            <span>অডিও বিভাগ</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope Toggle: All vs My Work */}
          <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setScopeFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition ${
                scopeFilter === 'ALL'
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              সকল কাজ ({formatBengaliNumber(orders.length)})
            </button>
            <button
              onClick={() => setScopeFilter('MINE')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                scopeFilter === 'MINE'
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>আমার কাজ ({formatBengaliNumber(myAssignedCount)})</span>
            </button>
          </div>

          {revisionCount > 0 && (
            <span className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-semibold animate-pulse flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{formatBengaliNumber(revisionCount)} টি রিভিশন</span>
            </span>
          )}
        </div>
      </div>

      {/* Target Order Notification Banner if coming from notification link */}
      {targetOrderId && (
        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-3 text-xs text-blue-300">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
            <span>চিহ্নিত অর্ডারটি নিচে দেখুন</span>
          </div>
          <Link
            to="/audio"
            className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-[11px] font-medium"
          >
            সব দেখুন
          </Link>
        </div>
      )}

      {/* Department Status Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'ALL', label: 'সকল অডিও কাজ', count: orders.length },
          { key: 'AUDIO_PENDING', label: 'পেন্ডিং / নতুন', count: pendingCount },
          { key: 'AUDIO_IN_PROGRESS', label: 'কাজ চলছে', count: inProgressCount },
          { key: 'COMPLETED', label: 'সম্পন্ন কাজ', count: completedCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px]">
              {formatBengaliNumber(tab.count)}
            </span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs">
            অডিও অর্ডার লোড হচ্ছে...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 text-xs bg-slate-900/50 rounded-3xl border border-slate-800">
            {scopeFilter === 'MINE'
              ? 'আপনার নামে এখনও কোনো অডিও কাজ বরাদ্দ করা হয়নি। "সকল কাজ" ট্যাবে গিয়ে কাজের দায়িত্ব নিন।'
              : 'এই তালিকায় কোন অডিও কাজ পাওয়া যায়নি।'}
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isTarget = targetOrderId === ord.id || targetOrderId === ord.order_number
            const isPending = ord.overall_status === 'AUDIO_PENDING' || ord.overall_status === 'NEW'

            return (
              <div
                key={ord.id}
                id={`order-${ord.id}`}
                className={`p-5 rounded-3xl bg-slate-900/80 border transition-all flex flex-col justify-between space-y-4 shadow-xl ${
                  isTarget
                    ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-950/20'
                    : ord.overall_status === 'AUDIO_REVISION'
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : ord.overall_status === 'AUDIO_IN_PROGRESS'
                    ? 'border-blue-500/40'
                    : 'border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{ord.order_number}</span>
                    <StatusBadge status={ord.overall_status} />
                  </div>

                  <h3 className="font-semibold text-slate-100 text-sm line-clamp-1">{ord.title}</h3>
                  <div className="text-xs text-blue-400/90 font-medium">
                    {ord.category?.name_bn || 'কাস্টম অর্ডার'}
                  </div>

                  {/* Client and Phone */}
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">ক্লায়েন্ট / প্রার্থী:</span>
                      <span className="font-semibold text-white">{ord.client_name}</span>
                    </div>
                    {ord.client_phone && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">WhatsApp / ফোন:</span>
                        <a
                          href={`https://wa.me/88${ord.client_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{ord.client_phone}</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {ord.overall_status === 'AUDIO_REVISION' && (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                      <div className="font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                        <span>রিভিশন নির্দেশনা:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {ord.revisions && ord.revisions.length > 0
                          ? ord.revisions[0].instructions
                          : 'ভয়েস উচ্চারণ ও বিট সংশোধন করে পুনরায় সাবমিট করুন।'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                  {canAction && (
                    <>
                      {/* Claim Button if not assigned */}
                      {!ord.assigned_audio_staff_id && (
                        <button
                          onClick={() => handleClaimOrder(ord.id)}
                          disabled={actionLoadingId === ord.id}
                          className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>{actionLoadingId === ord.id ? 'গ্রহণ হচ্ছে...' : 'কাজের দায়িত্ব নিন'}</span>
                        </button>
                      )}

                      {/* Start Work button if pending and assigned */}
                      {isPending && ord.assigned_audio_staff_id && (
                        <button
                          onClick={() => handleStartWork(ord.id)}
                          disabled={actionLoadingId === ord.id}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>কাজ শুরু করুন</span>
                        </button>
                      )}

                      {/* Complete Button if in progress or revision */}
                      {(ord.overall_status === 'AUDIO_IN_PROGRESS' || ord.overall_status === 'AUDIO_REVISION') && (
                        <button
                          onClick={() => setConfirmOrder(ord)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/30 cursor-pointer"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>অডিও সম্পন্ন</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Already Completed Badge */}
                  {['VIDEO_PENDING', 'VIDEO_IN_PROGRESS', 'VIDEO_SUBMITTED', 'VIDEO_QC', 'READY_FOR_DELIVERY', 'DELIVERED', 'AUDIO_QC'].includes(ord.overall_status) && (
                    <span className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>অডিও সম্পন্ন</span>
                    </span>
                  )}

                  <Link
                    to={`/orders/${ord.id}`}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                  >
                    বিস্তারিত
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 1-CLICK CONFIRMATION MODAL */}
      {confirmOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">অডিও কাজ কি সম্পন্ন?</h3>
                <p className="text-[11px] text-blue-400 font-medium">{confirmOrder.order_number}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="font-semibold text-slate-200">{confirmOrder.title}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {confirmOrder.video_required
                  ? 'অডিও কাজ সম্পন্ন হলে এই কাজটি স্বয়ংক্রিয়ভাবে ভিডিও প্রোডাকশন বিভাগের কাছে চলে যাবে।'
                  : 'অডিও কাজ সম্পন্ন হলে এই অর্ডারটি সরাসরি ডেলিভারির তালিকায় চলে যাবে।'}
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmOrder(null)}
                disabled={completing}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleCompleteAudioWork(confirmOrder)}
                disabled={completing}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>{completing ? 'সংরক্ষণ হচ্ছে...' : 'হ্যাঁ, সম্পন্ন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
