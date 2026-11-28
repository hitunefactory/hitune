import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Video,
  Upload,
  AlertCircle,
  Clock,
  Download,
  ExternalLink,
  Sparkles,
  Headphones,
  UserCheck,
  Phone,
  Play,
  CheckCircle,
} from 'lucide-react'
import { dataService } from '../../services/dataService'
import { Order } from '../../types/database'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useAuth } from '../../contexts/AuthContext'
import { formatBengaliNumber } from '../../lib/utils'
import { useBackOverlay } from '../../hooks/useBackOverlay'

export const VideoDeptPage: React.FC = () => {
  const { user, currentRole } = useAuth()
  const canAction = currentRole === 'VIDEO_EDITOR' || (currentRole === 'SUPER_ADMIN' && user?.role === 'SUPER_ADMIN')
  const [searchParams] = useSearchParams()
  const targetOrderId = searchParams.get('orderId')
  const initialStatusFilter = searchParams.get('status') || 'ALL'

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter)
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'MINE'>('ALL')

  useEffect(() => {
    setStatusFilter(searchParams.get('status') || 'ALL')
  }, [searchParams])

  // Confirmation Modal
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null)
  const [completing, setCompleting] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  useBackOverlay(Boolean(confirmOrder) && !completing, () => setConfirmOrder(null))

  const loadVideoOrders = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const allOrders = await dataService.getOrders()
      // Filter for orders requiring video
      const videoOrders = allOrders.filter((o) => o.video_required)
      setOrders(videoOrders)
    } catch (err) {
      console.error('Failed to load video orders:', err)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }

  useEffect(() => {
    loadVideoOrders()
    const onSync = () => {
      loadVideoOrders(true)
    }
    window.addEventListener('hitune:data-synced', onSync)
    return () => window.removeEventListener('hitune:data-synced', onSync)
  }, [])

  const handleStartWork = async (orderId: string) => {
    setActionLoadingId(orderId)
    try {
      await dataService.updateOrderStatus(orderId, 'VIDEO_IN_PROGRESS', 'ভিডিও এডিটর কাজ শুরু করেছেন।')
      await loadVideoOrders()
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
      await dataService.claimVideoOrder(orderId, user.id)
      await loadVideoOrders()
    } catch (err) {
      console.error('Claim video order failed:', err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCompleteVideoWork = async (order: Order) => {
    setCompleting(true)
    try {
      await dataService.updateOrderStatus(order.id, 'READY_FOR_DELIVERY', 'ভিডিও কাজ সম্পন্ন করা হয়েছে।')
      dataService.notifyVideoCompleted(order)
      setConfirmOrder(null)
      await loadVideoOrders()
    } catch (err) {
      console.error('Complete video failed:', err)
    } finally {
      setCompleting(false)
    }
  }

  const filteredOrders = orders.filter((o) => {
    // 1. Scope filter
    if (scopeFilter === 'MINE') {
      if (o.assigned_video_staff_id !== user?.id) return false
    }

    // 2. Status filter
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'VIDEO_PENDING') {
      return o.overall_status === 'VIDEO_PENDING' || (!o.audio_required && o.overall_status === 'NEW')
    }
    if (statusFilter === 'VIDEO_IN_PROGRESS') {
      return o.overall_status === 'VIDEO_IN_PROGRESS' || o.overall_status === 'VIDEO_REVISION'
    }
    if (statusFilter === 'COMPLETED') {
      return ['READY_FOR_DELIVERY', 'DELIVERED', 'VIDEO_QC'].includes(o.overall_status)
    }
    return o.overall_status === statusFilter
  })

  const inProgressCount = orders.filter((o) => o.overall_status === 'VIDEO_IN_PROGRESS' || o.overall_status === 'VIDEO_REVISION').length
  const revisionCount = orders.filter((o) => o.overall_status === 'VIDEO_REVISION').length
  const pendingCount = orders.filter((o) => o.overall_status === 'VIDEO_PENDING' || (!o.audio_required && o.overall_status === 'NEW')).length
  const completedCount = orders.filter((o) => ['READY_FOR_DELIVERY', 'DELIVERED', 'VIDEO_QC'].includes(o.overall_status)).length
  const waitingAudioCount = orders.filter((o) => 
    ['AUDIO_PENDING', 'AUDIO_IN_PROGRESS', 'AUDIO_SUBMITTED', 'AUDIO_QC', 'AUDIO_REVISION', 'NEW'].includes(o.overall_status) && o.audio_required
  ).length
  const myAssignedCount = user ? orders.filter((o) => o.assigned_video_staff_id === user.id).length : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="h-6 w-6 text-cyan-400" />
            <span>ভিডিও বিভাগ</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope Toggle: All vs My Work */}
          <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setScopeFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition ${
                scopeFilter === 'ALL'
                  ? 'bg-cyan-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              সকল কাজ ({formatBengaliNumber(orders.length)})
            </button>
            <button
              onClick={() => setScopeFilter('MINE')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                scopeFilter === 'MINE'
                  ? 'bg-cyan-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>আমার কাজ ({formatBengaliNumber(myAssignedCount)})</span>
            </button>
          </div>

          {waitingAudioCount > 0 && (
            <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5">
              <Headphones className="h-3.5 w-3.5" />
              <span>{formatBengaliNumber(waitingAudioCount)} টি অডিও অনুমোদনের অপেক্ষায়</span>
            </span>
          )}

          {revisionCount > 0 && (
            <span className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-semibold animate-pulse flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{formatBengaliNumber(revisionCount)} টি রিভিশন</span>
            </span>
          )}
        </div>
      </div>

      {/* Target Order Banner */}
      {targetOrderId && (
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>চিহ্নিত অর্ডারটি নিচে দেখুন</span>
          </div>
          <Link
            to="/video"
            className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 text-[11px] font-medium"
          >
            সব দেখুন
          </Link>
        </div>
      )}

      {/* Department Status Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'ALL', label: 'সকল ভিডিও কাজ', count: orders.length },
          { key: 'VIDEO_PENDING', label: 'পেন্ডিং / অপেক্ষমাণ', count: pendingCount },
          { key: 'VIDEO_IN_PROGRESS', label: 'কাজ চলছে', count: inProgressCount },
          { key: 'COMPLETED', label: 'সম্পন্ন কাজ', count: completedCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? 'bg-cyan-600 text-white font-semibold shadow-md shadow-cyan-600/30'
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

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs">
            ভিডিও অর্ডার লোড হচ্ছে...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 text-xs bg-slate-900/50 rounded-3xl border border-slate-800">
            {scopeFilter === 'MINE'
              ? 'আপনার নামে এখনও কোনো ভিডিও কাজ বরাদ্দ করা হয়নি। "সকল কাজ" ট্যাবে গিয়ে কাজের দায়িত্ব নিন।'
              : 'এই তালিকায় কোন ভিডিও কাজ পাওয়া যায়নি।'}
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isTarget = targetOrderId === ord.id || targetOrderId === ord.order_number
            const isWaitingForAudio = [
              'AUDIO_PENDING',
              'AUDIO_IN_PROGRESS',
              'AUDIO_SUBMITTED',
              'AUDIO_QC',
              'AUDIO_REVISION',
              'NEW',
            ].includes(ord.overall_status) && ord.audio_required

            return (
              <div
                key={ord.id}
                id={`order-${ord.id}`}
                className={`p-5 rounded-3xl bg-slate-900/80 border transition-all flex flex-col justify-between space-y-4 shadow-xl ${
                  isTarget
                    ? 'border-cyan-400 ring-2 ring-cyan-400/50 bg-cyan-950/20'
                    : ord.overall_status === 'VIDEO_REVISION'
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : ord.overall_status === 'VIDEO_IN_PROGRESS'
                    ? 'border-cyan-500/40'
                    : 'border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{ord.order_number}</span>
                    <StatusBadge status={ord.overall_status} />
                  </div>

                  <h3 className="font-semibold text-slate-100 text-sm line-clamp-1">{ord.title}</h3>
                  <div className="text-xs text-cyan-400/90 font-medium">
                    {ord.category?.name_bn || 'কাস্টম ভিডিও'}
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

                  {isWaitingForAudio ? (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                      অডিও ফাইল সম্পন্ন ও অনুমোদিত হওয়ার পর ভিডিও এডিটিং শুরু হবে।
                    </div>
                  ) : ord.overall_status === 'VIDEO_REVISION' ? (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                      <div className="font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                        <span>ভিডিও রিভিশন নির্দেশনা:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {ord.revisions && ord.revisions.length > 0
                          ? ord.revisions[0].instructions
                          : 'ফুটেজ ও টেক্সট সঠিক করে পুনরায় রেন্ডার করুন।'}
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                  {canAction && (
                    <>
                      {/* Claim Button if not assigned or not assigned to me */}
                      {!ord.assigned_video_staff_id && !isWaitingForAudio && (
                        <button
                          onClick={() => handleClaimOrder(ord.id)}
                          disabled={actionLoadingId === ord.id}
                          className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>{actionLoadingId === ord.id ? 'গ্রহণ হচ্ছে...' : 'কাজের দায়িত্ব নিন'}</span>
                        </button>
                      )}

                      {/* Start Work button if pending and assigned */}
                      {ord.overall_status === 'VIDEO_PENDING' && !isWaitingForAudio && ord.assigned_video_staff_id && (
                        <button
                          onClick={() => handleStartWork(ord.id)}
                          disabled={actionLoadingId === ord.id}
                          className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>ভিডিও কাজ শুরু করুন</span>
                        </button>
                      )}

                      {/* Complete Button if in progress or revision */}
                      {(ord.overall_status === 'VIDEO_IN_PROGRESS' || ord.overall_status === 'VIDEO_REVISION') && (
                        <button
                          onClick={() => setConfirmOrder(ord)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/30 cursor-pointer"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>ভিডিও সম্পন্ন</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Waiting for audio indicator */}
                  {isWaitingForAudio && (
                    <span className="flex-1 py-2 bg-slate-950/60 border border-slate-800 text-slate-400 rounded-xl text-xs flex items-center justify-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <span>অডিওর অপেক্ষায়</span>
                    </span>
                  )}

                  {/* Already Completed Badge */}
                  {['READY_FOR_DELIVERY', 'DELIVERED', 'VIDEO_QC'].includes(ord.overall_status) && (
                    <span className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>ভিডিও সম্পন্ন</span>
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
                <h3 className="font-bold text-white text-sm">ভিডিও কাজ কি সম্পন্ন?</h3>
                <p className="text-[11px] text-cyan-400 font-medium">{confirmOrder.order_number}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="font-semibold text-slate-200">{confirmOrder.title}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ভিডিও কাজ সম্পন্ন হিসেবে চিহ্নিত করলে এই অর্ডারটি সরাসরি ডেলিভারির জন্য প্রস্তুত তালিকায় চলে যাবে।
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
                onClick={() => handleCompleteVideoWork(confirmOrder)}
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
