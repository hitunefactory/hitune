import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  Edit3,
  Trash2,
} from 'lucide-react'
import { dataService } from '../../services/dataService'
import { Order, Profile } from '../../types/database'
import { StatusBadge, PaymentBadge } from '../../components/ui/StatusBadge'
import { useAuth } from '../../contexts/AuthContext'
import { formatBengaliDate, formatBengaliNumber, formatCurrency } from '../../lib/utils'
import { EditOrderModal } from '../../components/orders/EditOrderModal'
import { useBackOverlay } from '../../hooks/useBackOverlay'

export const DeliveryPage: React.FC = () => {
  const { user, hasRole } = useAuth()
  const canManageOrders = hasRole(['SUPER_ADMIN', 'ORDER_MANAGER', 'DELIVERY_MANAGER'])
  const [searchParams] = useSearchParams()
  const targetOrderId = searchParams.get('orderId')
  const targetSection = searchParams.get('section')
  const [orders, setOrders] = useState<Order[]>([])
  const [staffList, setStaffList] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  // Edit & Delete Modals
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Delivery Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'ONLINE' | 'PENDRIVE' | 'WHATSAPP' | 'EMAIL' | 'OTHER'>('WHATSAPP')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useBackOverlay(Boolean(selectedOrder) && !submitting, () => setSelectedOrder(null))
  useBackOverlay(Boolean(deletingOrder) && !deleting, () => setDeletingOrder(null))

  const loadDeliveryOrders = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const [allOrders, staff] = await Promise.all([
        dataService.getOrders(),
        dataService.getStaff(),
      ])
      setStaffList(staff)
      // Filter for ready for delivery or delivered
      const list = allOrders.filter(
        (o) => o.overall_status === 'READY_FOR_DELIVERY' || o.overall_status === 'DELIVERED'
      )
      setOrders(list)
    } catch (err) {
      console.error('Failed to load delivery orders:', err)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!deletingOrder) return
    setDeleting(true)
    try {
      await dataService.deleteOrder(deletingOrder.id)
      setDeletingOrder(null)
      await loadDeliveryOrders()
    } catch (err: any) {
      console.error('Delete order failed:', err)
      alert(err?.message || 'অর্ডার মুছে ফেলতে সমস্যা হয়েছে')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    loadDeliveryOrders()
    const onSync = () => {
      loadDeliveryOrders(true)
    }
    window.addEventListener('hitune:data-synced', onSync)
    return () => window.removeEventListener('hitune:data-synced', onSync)
  }, [])

  useEffect(() => {
    if (loading) return
    if (targetOrderId) {
      const match = orders.find((o) => o.id === targetOrderId || o.order_number === targetOrderId)
      if (match) {
        const el = document.getElementById(`delivery-order-${match.id}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    if (targetSection === 'completed') {
      const el = document.getElementById('completed-deliveries')
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [loading, targetOrderId, targetSection, orders])

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
      await loadDeliveryOrders()
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
            <span>ডেলিভারি বিভাগ</span>
          </h1>
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
                id={`delivery-order-${ord.id}`}
                className={`p-5 rounded-3xl bg-slate-900/90 border shadow-xl space-y-3 flex flex-col justify-between transition ${
                  targetOrderId === ord.id || targetOrderId === ord.order_number
                    ? 'border-teal-400 ring-2 ring-teal-400/50'
                    : 'border-teal-500/40'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-100 text-sm leading-snug">{ord.title}</h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {ord.category?.name_bn} • <span className="font-mono text-slate-300">{ord.order_number}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={ord.overall_status} />
                    </div>
                  </div>

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
                    className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span>ডেলিভারি সম্পন্ন করুন</span>
                  </button>

                  <Link
                    to={`/orders/${ord.id}`}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                  >
                    বিস্তারিত
                  </Link>

                  {canManageOrders && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditingOrder(ord)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700/80 rounded-xl text-xs transition cursor-pointer"
                        title="অর্ডার সম্পাদনা"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingOrder(ord)}
                        className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 rounded-xl text-xs transition cursor-pointer"
                        title="অর্ডার মুছুন"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Deliveries History */}
      <div id="completed-deliveries" className="space-y-3 pt-4 scroll-mt-20">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>সম্প্রতি সম্পন্ন ডেলিভারি রেকর্ড</span>
        </h2>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1120]/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">কাজের শিরোনাম</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">ক্লায়েন্ট</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">স্ট্যাটাস</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">অর্ডার নং</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">পেমেন্ট অবস্থা</th>
                  <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {completedOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                    <td
                      className="py-3 px-4 font-medium text-slate-100 max-w-[200px] truncate"
                      title={ord.title}
                    >
                      {ord.title}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{ord.client_name}</div>
                      <div className="text-[11px] text-slate-400">{ord.client_phone}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={ord.overall_status} />
                    </td>
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap text-xs">
                      {ord.order_number}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <PaymentBadge status={ord.payment_status} />
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          to={`/orders/${ord.id}`}
                          className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition font-medium text-xs"
                        >
                          বিস্তারিত
                        </Link>
                        {canManageOrders && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingOrder(ord)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700/80 rounded-xl text-xs transition cursor-pointer"
                              title="অর্ডার সম্পাদনা"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingOrder(ord)}
                              className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 rounded-xl text-xs transition cursor-pointer"
                              title="অর্ডার মুছুন"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
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

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          isOpen={Boolean(editingOrder)}
          onClose={() => setEditingOrder(null)}
          order={editingOrder}
          staffList={staffList}
          onOrderUpdated={() => loadDeliveryOrders()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingOrder && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0f172a] border border-rose-500/30 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">অর্ডারটি কি মুছে ফেলতে চান?</h3>
                <p className="text-xs text-rose-400 font-mono font-semibold">{deletingOrder.order_number}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="font-semibold text-slate-200">{deletingOrder.title}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                সতর্কতা: একবার মুছে ফেললে এই অর্ডারের তথ্য, পেমেন্ট হিসাব ও অভ্যন্তরীণ আলোচনা স্থায়ীভাবে অপসারিত হবে।
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingOrder(null)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={deleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{deleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
