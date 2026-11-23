import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { StatusBadge, PriorityBadge, PaymentBadge } from '../../components/ui/StatusBadge'
import { dataService } from '../../services/dataService'
import { Order, OrderCategory, OrderOverallStatus, OrderPriority } from '../../types/database'
import { STATUS_MAP_BN, PRIORITY_MAP_BN } from '../../lib/constants'
import { formatBengaliNumber, formatBengaliDate, formatCurrency } from '../../lib/utils'

export const OrdersListPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<OrderCategory[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL')

  const loadData = async () => {
    setLoading(true)
    try {
      const [orderList, catList] = await Promise.all([
        dataService.getOrders(),
        dataService.getCategories(),
      ])
      setOrders(orderList)
      setCategories(catList)
    } catch (err) {
      console.error('Failed to load orders list:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

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

    const matchesPriority =
      selectedPriority === 'ALL' || order.priority === selectedPriority

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority
  })

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-blue-500" />
            <span>অর্ডার তালিকা ও ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            সর্বমোট {formatBengaliNumber(filteredOrders.length)} টি অর্ডার প্রদর্শিত হচ্ছে
          </p>
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

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">সকল অগ্রাধিকার</option>
              {Object.entries(PRIORITY_MAP_BN).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1120]/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">অর্ডার নম্বর</th>
                  <th className="py-3.5 px-4 font-semibold">কাজের বিবরণ ও ক্যাটাগরি</th>
                  <th className="py-3.5 px-4 font-semibold">ক্লায়েন্ট ও যোগাযোগ</th>
                  <th className="py-3.5 px-4 font-semibold">বিভাগ</th>
                  <th className="py-3.5 px-4 font-semibold">অগ্রাধিকার</th>
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
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={ord.priority} />
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
                      <Link
                        to={`/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition font-medium text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>বিস্তারিত</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
