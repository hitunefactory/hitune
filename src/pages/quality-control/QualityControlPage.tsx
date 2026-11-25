import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  AlertCircle,
  FileAudio,
  FileVideo,
  ExternalLink,
  ThumbsUp,
  RotateCcw,
  Check,
  ShieldCheck,
} from 'lucide-react'
import { dataService } from '../../services/dataService'
import { Order, TaskSubmission } from '../../types/database'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useAuth } from '../../contexts/AuthContext'
import { formatBengaliDate, formatBengaliNumber } from '../../lib/utils'
import { useBackOverlay } from '../../hooks/useBackOverlay'

export const QualityControlPage: React.FC = () => {
  const { user } = useAuth()
  const [qcOrders, setQcOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Revision Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [targetDept, setTargetDept] = useState<'AUDIO' | 'VIDEO'>('AUDIO')
  const [revisionInstructions, setRevisionInstructions] = useState('')
  const [submittingRevision, setSubmittingRevision] = useState(false)

  useBackOverlay(Boolean(selectedOrder) && !submittingRevision, () => setSelectedOrder(null))

  const loadQCQueue = async () => {
    setLoading(true)
    try {
      const allOrders = await dataService.getOrders()
      // Filter orders waiting for QC
      const pendingQc = allOrders.filter(
        (o) => o.overall_status === 'AUDIO_QC' || o.overall_status === 'VIDEO_QC'
      )
      setQcOrders(pendingQc)
    } catch (err) {
      console.error('Failed to load QC orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQCQueue()
  }, [])

  const handleApprove = async (order: Order) => {
    if (!user) return
    const isAudio = order.overall_status === 'AUDIO_QC'
    const confirmMsg = isAudio
      ? `আপনি কি নিশ্চিতভাবে এই অডিও ফাইলটি অনুমোদন করতে চান? ${order.video_required ? '(অনুমোদনের পর ভিডিও ডিপার্টমেন্টে চলে যাবে)' : '(অনুমোদনের পর ডেলিভারির জন্য প্রস্তুত হবে)'}`
      : 'আপনি কি নিশ্চিতভাবে এই ভিডিও ফাইলটি অনুমোদন করতে চান? (অনুমোদনের পর ডেলিভারির জন্য প্রস্তুত হবে)'

    if (!window.confirm(confirmMsg)) return

    try {
      const subs = await dataService.getSubmissions(order.id)
      const subId = subs.length > 0 ? subs[0].id : `sub-auto-${Date.now()}`
      await dataService.approveSubmission(order.id, subId, user.id)
      loadQCQueue()
    } catch (err) {
      console.error('Approve failed:', err)
    }
  }

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder || !user || !revisionInstructions.trim()) return

    setSubmittingRevision(true)
    try {
      const subs = await dataService.getSubmissions(selectedOrder.id)
      const subId = subs.length > 0 ? subs[0].id : `sub-auto-${Date.now()}`
      await dataService.requestRevision(
        selectedOrder.id,
        subId,
        targetDept,
        revisionInstructions.trim(),
        user.id
      )
      setSelectedOrder(null)
      setRevisionInstructions('')
      loadQCQueue()
    } catch (err) {
      console.error('Revision request failed:', err)
    } finally {
      setSubmittingRevision(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <span>কোয়ালিটি কন্ট্রোল</span>
          </h1>
        </div>

        <span className="px-3 py-1 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-semibold">
          অপেক্ষমাণ পর্যালোচনা: {formatBengaliNumber(qcOrders.length)} টি
        </span>
      </div>

      {/* QC Queue Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            কোয়ালিটি কন্ট্রোল কিউ লোড হচ্ছে...
          </div>
        ) : qcOrders.length === 0 ? (
          <div className="p-10 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="h-9 w-9 text-emerald-400 mx-auto opacity-70" />
            <p className="text-sm font-bold text-white">কোনো ফাইল বাকি নেই</p>
          </div>
        ) : (
          qcOrders.map((ord) => {
            const isAudioQc = ord.overall_status === 'AUDIO_QC'

            return (
              <div
                key={ord.id}
                className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{ord.order_number}</span>
                      <StatusBadge status={ord.overall_status} />
                      <span className="text-xs text-slate-400 font-medium">
                        ({ord.category?.name_bn})
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-200 text-sm">{ord.title}</h3>
                  </div>

                  <div className="text-right text-xs text-slate-400">
                    <div>ক্লায়েন্ট: <span className="text-slate-200 font-medium">{ord.client_name}</span></div>
                    <div>ডেডলাইন: <span className="text-amber-400 font-medium">{formatBengaliDate(ord.deadline)}</span></div>
                  </div>
                </div>

                {/* Requirements & Notes Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-slate-400 block">কাজের বিবরণ ও চাহিদা:</span>
                    <p className="text-slate-300 leading-relaxed line-clamp-3">
                      {ord.description || 'কোন বিবরণ নেই'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-blue-400 block">অভ্যন্তরীণ নির্দেশনা:</span>
                    <p className="text-slate-300 leading-relaxed line-clamp-3">
                      {ord.internal_instructions || 'কোন অভ্যন্তরীণ নির্দেশনা নেই'}
                    </p>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Link
                    to={`/orders/${ord.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                  >
                    <span>ফাইল বিস্তারিত ও প্লে করুন</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(ord)
                        setTargetDept(isAudioQc ? 'AUDIO' : 'VIDEO')
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600/20 border border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-semibold transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>রিভিশন নির্দেশ দিন</span>
                    </button>

                    <button
                      onClick={() => handleApprove(ord)}
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition transform active:scale-95"
                    >
                      <Check className="h-4 w-4" />
                      <span>অনুমোদন করুন (Approve)</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* REVISION INSTRUCTION MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="font-bold text-white text-sm">রিভিশন নির্দেশনা প্রেরণ</h3>
                <p className="text-xs text-rose-400">{selectedOrder.order_number} ({targetDept === 'AUDIO' ? 'অডিও' : 'ভিডিও'})</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRequestRevision} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">সংশোধনের সুনির্দিষ্ট নির্দেশনা</label>
                <textarea
                  value={revisionInstructions}
                  onChange={(e) => setRevisionInstructions(e.target.value)}
                  rows={4}
                  required
                  placeholder="যেমন: ৩ নম্বর লাইনের উচ্চারণে সামান্য ভুল রয়েছে। বিট ও ভলিউম সামান্য বাড়িয়ে পুনরায় সাবমিট করুন..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingRevision}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{submittingRevision ? 'পাঠানো হচ্ছে...' : 'রিভিশন নির্দেশ পাঠান'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
