import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FolderKanban,
  Search,
  Plus,
  Filter,
  Calendar,
  Layers,
  ArrowUpDown,
  Download,
  Eye,
  Edit3,
  Trash2,
} from 'lucide-react'
import { StatusBadge, PaymentBadge } from '../../components/ui/StatusBadge'
import { dataService } from '../../services/dataService'
import { Order, OrderCategory, OrderOverallStatus, Profile } from '../../types/database'
import { STATUS_MAP_BN } from '../../lib/constants'
import { formatBengaliNumber, formatBengaliDate, formatCurrency, getLocalDateString } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import { EditOrderModal } from '../../components/orders/EditOrderModal'

export const OrdersListPage: React.FC = () => {
  const { hasRole } = useAuth()
  const canManageOrders = hasRole(['SUPER_ADMIN', 'ORDER_MANAGER', 'DELIVERY_MANAGER'])
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<OrderCategory[]>([])
  const [staffList, setStaffList] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  // Edit & Delete Modals
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedDateFilter, setSelectedDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'DAY_BEFORE' | 'CUSTOM'>('ALL')
  const [customDate, setCustomDate] = useState<string>(() => getLocalDateString(new Date()))

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const [orderList, catList, staff] = await Promise.all([
        dataService.getOrders(),
        dataService.getCategories(),
        dataService.getStaff(),
      ])
      setOrders(orderList)
      setCategories(catList)
      setStaffList(staff)
    } catch (err) {
      console.error('Failed to load orders list:', err)
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
      await loadData(true)
    } catch (err) {
      console.error('Delete order failed:', err)
      alert('অর্ডার মুছে ফেলতে সমস্যা হয়েছে')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    loadData()
    const onSync = () => {
      loadData(true)
    }
    window.addEventListener('hitune:data-synced', onSync)
    return () => window.removeEventListener('hitune:data-synced', onSync)
  }, [])

  const targetDateStr = useMemo(() => {
    const d = new Date()
    if (selectedDateFilter === 'TODAY') return getLocalDateString(d)
    if (selectedDateFilter === 'YESTERDAY') {
      d.setDate(d.getDate() - 1)
      return getLocalDateString(d)
    }
    if (selectedDateFilter === 'DAY_BEFORE') {
      d.setDate(d.getDate() - 2)
      return getLocalDateString(d)
    }
    if (selectedDateFilter === 'CUSTOM') return customDate
    return null
  }, [selectedDateFilter, customDate])

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !term ||
      order.order_number.toLowerCase().includes(term) ||
      order.title.toLowerCase().includes(term) ||
      order.client_name.toLowerCase().includes(term) ||
      order.client_phone.includes(term)

    const matchesCategory =
      selectedCategory === 'ALL' ||
      order.category_id === selectedCategory ||
      order.category?.id === selectedCategory ||
      order.category?.slug === selectedCategory

    const matchesStatus =
      selectedStatus === 'ALL' || order.overall_status === selectedStatus

    const matchesDate =
      !targetDateStr || getLocalDateString(order.created_at) === targetDateStr

    return matchesSearch && matchesCategory && matchesStatus && matchesDate
  })

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-blue-500" />
            <span>অর্ডার তালিকা</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {formatBengaliNumber(filteredOrders.length)} টি
            </span>
          </h1>
        </div>

        <Link
          to="/orders/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>নতুন অর্ডার তৈরি</span>
        </Link>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="অর্ডার নং, শিরোনাম, ক্লায়েন্ট বা ফোন..."
              className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">সকল ক্যাটাগরি</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_bn}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">সকল স্ট্যাটাস</option>
              {Object.entries(STATUS_MAP_BN).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">সকল সময় (তারিখ)</option>
              <option value="TODAY">আজকের অর্ডার</option>
              <option value="YESTERDAY">গতকালের অর্ডার</option>
              <option value="DAY_BEFORE">গত পরশুর অর্ডার</option>
              <option value="CUSTOM">নির্দিষ্ট তারিখ...</option>
            </select>
            {selectedDateFilter === 'CUSTOM' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0"
              />
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            অর্ডার তালিকা লোড হচ্ছে...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-sm font-medium text-slate-300">কোন অর্ডার পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500">আপনার ফিল্টার পরিবর্তন করুন অথবা নতুন অর্ডার যোগ করুন</p>
          </div>
        ) : (
          <div>
            {/* Mobile Cards View (Visible on mobile screens) */}
            <div className="block sm:hidden divide-y divide-slate-800/80">
              {filteredOrders.map((ord) => (
                <div key={ord.id} className="p-4 space-y-3 hover:bg-slate-800/30 transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-sm">{ord.order_number}</span>
                    <StatusBadge status={ord.overall_status} />
                  </div>

                  <div>
                    <div className="font-semibold text-white text-sm leading-snug">{ord.title}</div>
                    <div className="text-xs text-blue-400 mt-0.5">{ord.category?.name_bn || 'কাস্টম'}</div>
                  </div>

                  <div className="flex items-start justify-between text-xs text-slate-300 pt-1">
                    <div>
                      <span className="text-slate-400">ক্লায়েন্ট: </span>
                      <span className="font-medium text-slate-200">{ord.client_name}</span>
                      {ord.client_phone && (
                        <span className="text-slate-400 block font-mono text-[11px] mt-0.5">{ord.client_phone}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">{formatCurrency(ord.total_amount)}</div>
                      {ord.due_amount > 0 ? (
                        <div className="text-[11px] text-amber-400">বকেয়া: {formatCurrency(ord.due_amount)}</div>
                      ) : (
                        <div className="text-[11px] text-emerald-400">পরিশোধিত</div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {ord.audio_required && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">
                          অডিও
                        </span>
                      )}
                      {ord.video_required && (
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium">
                          ভিডিও
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>বিস্তারিত</span>
                      </Link>
                      {canManageOrders && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingOrder(ord)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700/80 transition cursor-pointer"
                            title="সম্পাদনা করুন"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingOrder(ord)}
                            className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (Visible on sm and larger screens) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1120]/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">অর্ডার নম্বর</th>
                    <th className="py-3.5 px-4 font-semibold">কাজের বিবরণ ও ক্যাটাগরি</th>
                    <th className="py-3.5 px-4 font-semibold">ক্লায়েন্ট ও যোগাযোগ</th>
                    <th className="py-3.5 px-4 font-semibold">বিভাগ</th>
                    <th className="py-3.5 px-4 font-semibold">ডেডলাইন</th>
                    <th className="py-3.5 px-4 font-semibold">স্ট্যাটাস</th>
                    <th className="py-3.5 px-4 font-semibold text-right">মূল্য / বকেয়া</th>
                    <th className="py-3.5 px-4 font-semibold text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                        {ord.order_number}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-100 truncate">{ord.title}</div>
                        <div className="text-[11px] text-blue-400/90 truncate">
                          {ord.category?.name_bn || 'কাস্টম'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200">{ord.client_name}</div>
                        <div className="text-[11px] text-slate-400">{ord.client_phone}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          {ord.audio_required && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              অডিও
                            </span>
                          )}
                          {ord.video_required && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              ভিডিও
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                        {formatBengaliDate(ord.deadline)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={ord.overall_status} />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-semibold text-slate-200">
                          {formatCurrency(ord.total_amount)}
                        </div>
                        {ord.due_amount > 0 ? (
                          <div className="text-[11px] text-amber-400">
                            বকেয়া: {formatCurrency(ord.due_amount)}
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-400">পরিশোধিত</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/orders/${ord.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition font-medium text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>বিস্তারিত</span>
                          </Link>
                          {canManageOrders && (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditingOrder(ord)}
                                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700/80 transition cursor-pointer"
                                title="অর্ডার সম্পাদনা করুন"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingOrder(ord)}
                                className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                                title="অর্ডার মুছে ফেলুন"
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
        )}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          isOpen={Boolean(editingOrder)}
          onClose={() => setEditingOrder(null)}
          order={editingOrder}
          staffList={staffList}
          onOrderUpdated={() => loadData(true)}
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
