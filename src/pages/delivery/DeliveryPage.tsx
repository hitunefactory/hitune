import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  Download,
  CheckCheck,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import { dataService } from '../../services/dataService'
import { Order } from '../../types/database'
import { StatusBadge, PaymentBadge } from '../../components/ui/StatusBadge'
import { useAuth } from '../../contexts/AuthContext'
import { formatBengaliDate, formatBengaliNumber, formatCurrency } from '../../lib/utils'

export const DeliveryPage: React.FC = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Delivery Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'ONLINE' | 'PENDRIVE' | 'WHATSAPP' | 'EMAIL' | 'OTHER'>('WHATSAPP')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadDeliveryOrders = async () => {
    setLoading(true)
    try {
      const allOrders = await dataService.getOrders()
      // Filter for ready for delivery or delivered
      const list = allOrders.filter(
        (o) => o.overall_status === 'READY_FOR_DELIVERY' || o.overall_status === 'DELIVERED'
      )
      setOrders(list)
    } catch (err) {
      console.error('Failed to load delivery orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeliveryOrders()
  }, [])

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder || !user) return

    setSubmitting(true)
    try {
      await dataService.markDelivered(selectedOrder.id, {
        delivered_by: user.id,
        delivery_method: deliveryMethod,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        notes: deliveryNotes,
      })
      setSelectedOrder(null)
      loadDeliveryOrders()
    } catch (err) {
      console.error('Delivery confirmation failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const readyOrders = orders.filter((o) => o.overall_status === 'READY_FOR_DELIVERY')
  const completedOrders = orders.filter((o) => o.overall_status === 'DELIVERED')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="h-6 w-6 text-teal-400" />
            <span>ডেলিভারি ব্যবস্থাপনা বিভাগ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            কোয়ালিটি টেস্ট উত্তীর্ণ চূড়ান্ত ফাইল ক্লায়েন্টকে হস্তান্তর ও বিতরণ নিশ্চিতকরণ
          </p>
        </div>

        <span className="px-3 py-1 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-semibold">
          ডেলিভারির অপেক্ষায়: {formatBengaliNumber(readyOrders.length)} টি
        </span>
      </div>

      {/* Ready for Delivery Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <span>ডেলিভারির জন্য প্রস্তুত অর্ডারসমূহ</span>
        </h2>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">লোড হচ্ছে...</div>
        ) : readyOrders.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
            বর্তমানে ডেলিভারির অপেক্ষায় কোনো নতুন অর্ডার নেই।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-5 rounded-3xl bg-slate-900/90 border border-teal-500/40 shadow-xl space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{ord.order_number}</span>
                    <StatusBadge status={ord.overall_status} />
                  </div>

                  <h3 className="font-semibold text-slate-100 text-sm">{ord.title}</h3>
                  <div className="text-xs text-slate-400">{ord.category?.name_bn}</div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ক্লায়েন্ট:</span>
                      <span className="font-semibold text-white">{ord.client_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">মোবাইল:</span>
                      <span className="text-slate-300">{ord.client_phone}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <span className="text-slate-400">বকেয়া স্থিতি:</span>
                      <span className="font-bold text-amber-400">
                        {ord.due_amount > 0 ? formatCurrency(ord.due_amount) : 'সম্পূর্ণ পরিশোধিত'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrder(ord)
                      setRecipientName(ord.client_name)
                      setRecipientPhone(ord.client_phone)
                    }}
                    className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span>ডেলিভারি সম্পন্ন করুন</span>
                  </button>

                  <Link
                    to={`/orders/${ord.id}`}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                  >
                    ফাইল দেখুন
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Deliveries History */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>সম্প্রতি সম্পন্ন ডেলিভারি রেকর্ড</span>
        </h2>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1120]/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">অর্ডার নং</th>
                  <th className="py-3 px-4 font-semibold">কাজের শিরোনাম</th>
                  <th className="py-3 px-4 font-semibold">ক্লায়েন্টের নাম ও ফোন</th>
                  <th className="py-3 px-4 font-semibold">পেমেন্ট অবস্থা</th>
                  <th className="py-3 px-4 font-semibold">স্ট্যাটাস</th>
                  <th className="py-3 px-4 font-semibold text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {completedOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      {ord.order_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-100 max-w-xs truncate">
                      {ord.title}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{ord.client_name}</div>
                      <div className="text-[11px] text-slate-400">{ord.client_phone}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <PaymentBadge status={ord.payment_status} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={ord.overall_status} />
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Link
                        to={`/orders/${ord.id}`}
                        className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition font-medium text-xs"
                      >
                        বিস্তারিত
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DELIVERY COMPLETION MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="font-bold text-white text-sm">ডেলিভারি রেকর্ড সম্পন্ন করুন</h3>
                <p className="text-xs text-teal-400">{selectedOrder.order_number}: {selectedOrder.title}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">ডেলিভারি মাধ্যম</label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  <option value="WHATSAPP">হোয়াটসঅ্যাপ (WhatsApp Audio/Video)</option>
                  <option value="PENDRIVE">পেনড্রাইভ / এসডি কার্ড হস্তান্তর</option>
                  <option value="ONLINE">গুগল ড্রাইভ লিংক (Google Drive Link)</option>
                  <option value="EMAIL">ইমেইল (Email)</option>
                  <option value="OTHER">অন্যান্য</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">ফাইল গ্রহণকারীর নাম</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">গ্রহণকারীর ফোন নম্বর</label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">ডেলিভারি নোট</label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={2}
                  placeholder="ক্লায়েন্ট সন্তোষজনকভাবে ফাইল বুঝে নিয়েছেন।"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
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
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold"
                >
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'ডেলিভারি নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
