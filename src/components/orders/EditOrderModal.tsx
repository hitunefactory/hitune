import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Edit3, User, Phone, Calendar, DollarSign, Shield, AlertCircle } from 'lucide-react'
import { Order, Profile, OrderPriority } from '../../types/database'
import { dataService } from '../../services/dataService'
import { formatBengaliNumber, formatCurrency } from '../../lib/utils'
import { useBackOverlay } from '../../hooks/useBackOverlay'

interface EditOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order
  staffList: Profile[]
  onOrderUpdated: () => void
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  staffList,
  onOrderUpdated,
}) => {
  const [title, setTitle] = useState(order.title)
  const [clientName, setClientName] = useState(order.client_name)
  const [clientPhone, setClientPhone] = useState(order.client_phone)
  const [clientAddress, setClientAddress] = useState(order.client_address || '')
  const [deadline, setDeadline] = useState(
    order.deadline ? order.deadline.split('T')[0] : ''
  )
  const [priority, setPriority] = useState<OrderPriority>(order.priority)
  const [totalAmount, setTotalAmount] = useState<number>(order.total_amount)
  const [paidAmount, setPaidAmount] = useState<number>(order.paid_amount)
  const [assignedAudioId, setAssignedAudioId] = useState(order.assigned_audio_staff_id || '')
  const [assignedVideoId, setAssignedVideoId] = useState(order.assigned_video_staff_id || '')
  const [description, setDescription] = useState(order.description || '')
  const [internalInstructions, setInternalInstructions] = useState(order.internal_instructions || '')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useBackOverlay(isOpen, onClose)

  if (!isOpen) return null

  const dueAmount = Math.max(0, (Number(totalAmount) || 0) - (Number(paidAmount) || 0))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !clientName.trim() || !clientPhone.trim()) {
      setError('অনুগ্রহ করে প্রয়োজনীয় সব তথ্য পূরণ করুন।')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await dataService.updateOrderDetails(order.id, {
        title: title.trim(),
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_address: clientAddress.trim(),
        deadline: deadline ? new Date(deadline).toISOString() : order.deadline,
        priority,
        total_amount: Number(totalAmount) || 0,
        paid_amount: Number(paidAmount) || 0,
        due_amount: dueAmount,
        assigned_audio_staff_id: assignedAudioId || undefined,
        assigned_video_staff_id: assignedVideoId || undefined,
        description: description.trim(),
        internal_instructions: internalInstructions.trim(),
      })

      onOrderUpdated()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'অর্ডার আপডেট করতে সমস্যা হয়েছে')
    } finally {
      setSubmitting(false)
    }
  }

  const audioDesigners = staffList.filter((s) => s.role === 'AUDIO_DESIGNER' || s.roles?.includes('AUDIO_DESIGNER'))
  const videoEditors = staffList.filter((s) => s.role === 'VIDEO_EDITOR' || s.roles?.includes('VIDEO_EDITOR'))

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-[#0f172a] border border-slate-700/80 rounded-3xl max-w-xl w-full my-auto shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0b1120]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center ring-1 ring-blue-500/30">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>অর্ডার তথ্য সম্পাদনা</span>
                <span className="text-xs font-mono text-blue-400">({order.order_number})</span>
              </h2>
              <p className="text-[11px] text-slate-400">অর্ডারের শিরোনাম, ক্লায়েন্ট তথ্য ও মূল্য পরিবর্তন করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              অর্ডারের শিরোনাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                ক্লায়েন্টের নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                ক্লায়েন্টের মোবাইল নম্বর <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ক্লায়েন্টের ঠিকানা</label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="জামালপুর পৌরসভা"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ডেলিভারির তারিখ</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-white block">বিল ও পেমেন্ট সমন্বয়:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">মোট মূল্য (৳)</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">পরিশোধিত (৳)</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-emerald-400 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">বর্তমান বকেয়া (৳)</label>
                <input
                  type="text"
                  readOnly
                  value={formatCurrency(dueAmount)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-amber-400 font-bold cursor-not-allowed select-none"
                />
              </div>
            </div>
          </div>

          {/* Staff Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {order.audio_required && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">দায়িত্বপ্রাপ্ত অডিও ডিজাইনার</label>
                <select
                  value={assignedAudioId}
                  onChange={(e) => setAssignedAudioId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">অ্যাসাইন করা হয়নি</option>
                  {audioDesigners.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.bengali_name || s.full_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {order.video_required && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">দায়িত্বপ্রাপ্ত ভিডিও এডিটর</label>
                <select
                  value={assignedVideoId}
                  onChange={(e) => setAssignedVideoId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">অ্যাসাইন করা হয়নি</option>
                  {videoEditors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.bengali_name || s.full_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">সাধারণ বিবরণ ও নোট</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">টিম ইন্টারনাল স্পেশাল নির্দেশনা</label>
            <textarea
              value={internalInstructions}
              onChange={(e) => setInternalInstructions(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition cursor-pointer"
            >
              বাতিল
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{submitting ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}
