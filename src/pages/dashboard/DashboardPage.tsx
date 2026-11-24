import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  Sparkles,
  Clock,
  Headphones,
  CheckCircle,
  Video,
  AlertCircle,
  Truck,
  CheckCheck,
  XCircle,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Filter,
  CalendarDays,
  Coins,
  ChevronDown,
  Phone,
} from 'lucide-react'
import { StatCard } from '../../components/dashboard/StatCard'
import { StatusBadge, PriorityBadge } from '../../components/ui/StatusBadge'
import { dataService } from '../../services/dataService'
import { Order, Payment } from '../../types/database'
import { formatBengaliNumber, formatBengaliDate, formatCurrency, getLocalDateString } from '../../lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

type DateFilterType = 'TODAY' | 'YESTERDAY' | 'DAY_BEFORE' | 'CUSTOM' | 'ALL'

export const DashboardPage: React.FC = () => {
  const [lifetimeStats, setLifetimeStats] = useState<any>(null)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  // Date Filter State (Default: TODAY in local timezone)
  const [dateFilter, setDateFilter] = useState<DateFilterType>('TODAY')
  const [customDate, setCustomDate] = useState<string>(() => getLocalDateString(new Date()))
  const [showLifetimeSection, setShowLifetimeSection] = useState(false)

  const loadDashboardData = async (isSilent = false) => {
    // Only set loading true on initial page load if no data exists yet
    if (!isSilent && !lifetimeStats) {
      setLoading(true)
    }

    try {
      const [stats, orders, payments] = await Promise.all([
        dataService.getDashboardStats(),
        dataService.getOrders(),
        dataService.getPayments(),
      ])

      setLifetimeStats(stats)
      setAllOrders(orders)
      setAllPayments(payments)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      if (!isSilent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadDashboardData()

    // Silent background refresh on real-time sync (NO screen reload or flicker!)
    const handleSync = () => {
      loadDashboardData(true)
    }

    window.addEventListener('hitune:data-synced', handleSync)
    return () => window.removeEventListener('hitune:data-synced', handleSync)
  }, [])

  // Calculate target date string in local timezone (YYYY-MM-DD)
  const targetDateStr = useMemo(() => {
    const d = new Date()
    if (dateFilter === 'TODAY') {
      return getLocalDateString(d)
    }
    if (dateFilter === 'YESTERDAY') {
      d.setDate(d.getDate() - 1)
      return getLocalDateString(d)
    }
    if (dateFilter === 'DAY_BEFORE') {
      d.setDate(d.getDate() - 2)
      return getLocalDateString(d)
    }
    if (dateFilter === 'CUSTOM') {
      return customDate
    }
    return null // 'ALL'
  }, [dateFilter, customDate])

  // Filter orders according to local date
  const filteredOrders = useMemo(() => {
    if (!targetDateStr) return allOrders
    return allOrders.filter((o) => getLocalDateString(o.created_at) === targetDateStr)
  }, [allOrders, targetDateStr])

  // Filter payments according to local date
  const filteredPayments = useMemo(() => {
    if (!targetDateStr) return allPayments
    return allPayments.filter((p) => getLocalDateString(p.payment_date) === targetDateStr)
  }, [allPayments, targetDateStr])

  // Dynamic daily/filtered statistics
  const currentStats = useMemo(() => {
    const totalOrders = filteredOrders.length
    const newOrders = filteredOrders.filter((o) => o.overall_status === 'NEW').length
    const pendingOrders = filteredOrders.filter(
      (o) => o.overall_status === 'AUDIO_PENDING' || o.overall_status === 'VIDEO_PENDING'
    ).length
    const audioInProgress = filteredOrders.filter((o) => o.overall_status === 'AUDIO_IN_PROGRESS').length
    const audioCompleted = filteredOrders.filter((o) =>
      ['VIDEO_PENDING', 'VIDEO_IN_PROGRESS', 'VIDEO_SUBMITTED', 'VIDEO_QC', 'READY_FOR_DELIVERY', 'DELIVERED'].includes(
        o.overall_status
      )
    ).length
    const videoInProgress = filteredOrders.filter((o) => o.overall_status === 'VIDEO_IN_PROGRESS').length
    const videoCompleted = filteredOrders.filter((o) =>
      ['READY_FOR_DELIVERY', 'DELIVERED'].includes(o.overall_status)
    ).length
    const revisionNeeded = filteredOrders.filter(
      (o) => o.overall_status === 'AUDIO_REVISION' || o.overall_status === 'VIDEO_REVISION'
    ).length
    const readyForDelivery = filteredOrders.filter((o) => o.overall_status === 'READY_FOR_DELIVERY').length
    const delivered = filteredOrders.filter((o) => o.overall_status === 'DELIVERED').length
    const cancelled = filteredOrders.filter((o) => o.overall_status === 'CANCELLED').length

    const totalContractAmount = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    const totalAdvanceReceived = filteredOrders.reduce((sum, o) => sum + Number(o.advance_amount || 0), 0)
    const totalPaidAmount = filteredOrders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0)
    const totalDueAmount = filteredOrders.reduce((sum, o) => sum + Number(o.due_amount || 0), 0)
    const paymentsReceivedOnDate = filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

    return {
      totalOrders,
      newOrders,
      pendingOrders,
      audioInProgress,
      audioCompleted,
      videoInProgress,
      videoCompleted,
      revisionNeeded,
      readyForDelivery,
      delivered,
      cancelled,
      totalContractAmount,
      totalAdvanceReceived,
      totalPaidAmount,
      totalDueAmount,
      paymentsReceivedOnDate: paymentsReceivedOnDate || totalAdvanceReceived,
    }
  }, [filteredOrders, filteredPayments])

  // Category breakdown for filtered orders
  const categoryBreakdown = useMemo(() => {
    const catCountMap: Record<string, number> = {}
    filteredOrders.forEach((o) => {
      const catName = o.category?.name_bn || 'অন্যান্য'
      catCountMap[catName] = (catCountMap[catName] || 0) + 1
    })

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
    return Object.entries(catCountMap).map(([name, count], idx) => ({
      name,
      value: count,
      color: colors[idx % colors.length],
    }))
  }, [filteredOrders])

  // Bengali Date Display Label
  const dateDisplayTitle = useMemo(() => {
    if (dateFilter === 'TODAY') {
      return `আজকের রিপোর্ট — ${formatBengaliDate(targetDateStr)}`
    }
    if (dateFilter === 'YESTERDAY') {
      return `গতকালের রিপোর্ট — ${formatBengaliDate(targetDateStr)}`
    }
    if (dateFilter === 'DAY_BEFORE') {
      return `গত পরশুর রিপোর্ট — ${formatBengaliDate(targetDateStr)}`
    }
    if (dateFilter === 'CUSTOM') {
      return `নির্দিষ্ট তারিখের রিপোর্ট — ${formatBengaliDate(customDate)}`
    }
    return 'সার্বিক স্টুডিও রিপোর্ট (লাইফটাইম সর্বমোট)'
  }, [dateFilter, customDate, targetDateStr])

  if (loading || !lifetimeStats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">ড্যাশবোর্ড তথ্য লোড হচ্ছে...</span>
      </div>
    )
  }

  // Chart data for current date selection
  const productionChartData = [
    { name: 'নতুন', count: currentStats.newOrders },
    { name: 'পেন্ডিং', count: currentStats.pendingOrders },
    { name: 'অডিও কাজ', count: currentStats.audioInProgress },
    { name: 'ভিডিও কাজ', count: currentStats.videoInProgress },
    { name: 'রিভিশন', count: currentStats.revisionNeeded },
    { name: 'ডেলিভারি অপেক্ষা', count: currentStats.readyForDelivery },
    { name: 'ডেলিভার্ড', count: currentStats.delivered },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome & Action Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/60 via-slate-900 to-[#0b1120] border border-blue-500/20 p-6 lg:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>জামালপুর প্রোডাকশন কন্ট্রোল হাব</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              এইচ আই টিউন স্টুডিও ড্যাশবোর্ড
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              প্রতিদিনের অর্ডার, রিয়েল-টাইম প্রোডাকশন ওয়ার্কফ্লো এবং হিসাব নিরীক্ষণ।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/orders/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-blue-600/30 transition transform active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>নতুন অর্ডার গ্রহণ</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Date Filter Toolbar (Today / Yesterday / Day Before / Custom Date / All Time) */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-white">{dateDisplayTitle}</h2>
              <p className="text-[11px] text-slate-400">তারিখ নির্বাচন করে নির্দিষ্ট দিনের অর্ডার ও আয় দেখুন</p>
            </div>
          </div>

          {/* Quick Date Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setDateFilter('TODAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                dateFilter === 'TODAY'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              আজ
            </button>
            <button
              onClick={() => setDateFilter('YESTERDAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                dateFilter === 'YESTERDAY'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              গতকাল
            </button>
            <button
              onClick={() => setDateFilter('DAY_BEFORE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                dateFilter === 'DAY_BEFORE'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              গত পরশু
            </button>

            {/* Custom Date Picker Inline */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value)
                  setDateFilter('CUSTOM')
                }}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                dateFilter === 'ALL'
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              সকল সময়
            </button>
          </div>
        </div>
      </div>

      {/* Daily/Filtered Production Status Metric Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            <span>{dateFilter === 'ALL' ? 'সার্বিক অর্ডার স্থিতি' : 'নির্বাচিত তারিখের স্থিতি ও কাজ'}</span>
          </h2>
          <span className="text-xs text-blue-400/90 font-medium">
            মোট অর্ডার: {formatBengaliNumber(currentStats.totalOrders)} টি
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
          <StatCard
            title={dateFilter === 'ALL' ? 'মোট সর্বমোট অর্ডার' : 'নির্বাচিত দিনে অর্ডার'}
            value={currentStats.totalOrders}
            icon={FolderKanban}
            colorScheme="blue"
          />
          <StatCard
            title="নতুন অর্ডার"
            value={currentStats.newOrders}
            icon={Sparkles}
            colorScheme="cyan"
          />
          <StatCard
            title="পেন্ডিং অর্ডার"
            value={currentStats.pendingOrders}
            icon={Clock}
            colorScheme="amber"
          />
          <StatCard
            title="অডিও কাজ চলমান"
            value={currentStats.audioInProgress}
            icon={Headphones}
            colorScheme="blue"
          />
          <StatCard
            title="ভিডিও কাজ চলমান"
            value={currentStats.videoInProgress}
            icon={Video}
            colorScheme="cyan"
          />
          <StatCard
            title="ডেলিভারি সম্পন্ন"
            value={currentStats.delivered}
            icon={CheckCheck}
            colorScheme="emerald"
          />
        </div>
      </div>

      {/* Daily Financial Cards for Selected Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={dateFilter === 'ALL' ? 'মোট চুক্তি মূল্য' : 'দিনের অর্ডারের চুক্তি মূল্য'}
          value={currentStats.totalContractAmount}
          subValue={dateFilter === 'ALL' ? 'সর্বমোট অর্ডার মূল্য' : 'নির্বাচিত তারিখে গৃহীত অর্ডারের মোট প্রাইজ'}
          icon={Coins}
          colorScheme="blue"
          isCurrency
        />
        <StatCard
          title={dateFilter === 'ALL' ? 'মোট সংগৃহীত পেমেন্ট' : 'দিনের সংগৃহীত পেমেন্ট'}
          value={currentStats.paymentsReceivedOnDate}
          subValue={dateFilter === 'ALL' ? 'যাচাইকৃত ক্যাশ জমা' : 'অগ্রিম ও আদায়কৃত ক্যাশ'}
          icon={Wallet}
          colorScheme="emerald"
          isCurrency
        />
        <StatCard
          title={dateFilter === 'ALL' ? 'মোট বকেয়া প্রাপ্য' : 'দিনের অর্ডারে বাকি / বকেয়া'}
          value={currentStats.totalDueAmount}
          subValue="ক্লায়েন্টদের কাছে অবশিষ্ট বকেয়া"
          icon={AlertCircle}
          colorScheme="amber"
          isCurrency
        />
      </div>

      {/* Orders Table for the Selected Date */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-400" />
              <span>{dateFilter === 'ALL' ? 'সকল অর্ডার তালিকা' : `${dateDisplayTitle} এর তালিকা`}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              সর্বমোট {formatBengaliNumber(filteredOrders.length)} টি অর্ডার পাওয়া গেছে
            </p>
          </div>
          <Link
            to="/orders"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
          >
            <span>সম্পূর্ণ ম্যানেজমেন্ট পেজে যান</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1120]/70 text-slate-400 border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-4 font-semibold">অর্ডার নং</th>
                <th className="py-3 px-4 font-semibold">কাজের শিরোনাম ও ক্যাটাগরি</th>
                <th className="py-3 px-4 font-semibold">ক্লায়েন্ট ও ফোন</th>
                <th className="py-3 px-4 font-semibold">অগ্রাধিকার</th>
                <th className="py-3 px-4 font-semibold">ডেডলাইন</th>
                <th className="py-3 px-4 font-semibold">প্রোডাকশন স্থিতি</th>
                <th className="py-3 px-4 font-semibold text-right">মোট / বকেয়া</th>
                <th className="py-3 px-4 font-semibold text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    <div className="space-y-1">
                      <p className="text-slate-300 font-medium">
                        {dateFilter === 'TODAY'
                          ? 'আজকে এখনও কোনো নতুন অর্ডার এন্ট্রি করা হয়নি।'
                          : 'নির্বাচিত এই তারিখে কোনো অর্ডার পাওয়া যায়নি।'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        উপরে "গতকাল", "গত পরশু" বা তারিখ পরিবর্তন করে পূর্বের অর্ডার দেখতে পারেন অথবা "+ নতুন অর্ডার গ্রহণ" বাটনে ক্লিক করুন।
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      {ord.order_number}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <div className="font-medium text-slate-100 truncate">{ord.title}</div>
                      <div className="text-[11px] text-blue-400/90 truncate">{ord.category?.name_bn || 'কাস্টম'}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{ord.client_name}</div>
                      {ord.client_phone && (
                        <a
                          href={`https://wa.me/88${ord.client_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{ord.client_phone}</span>
                        </a>
                      )}
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
                      <div className="font-semibold text-slate-200">{formatCurrency(ord.total_amount)}</div>
                      {ord.due_amount > 0 ? (
                        <div className="text-[11px] text-amber-400">বকেয়া: {formatCurrency(ord.due_amount)}</div>
                      ) : (
                        <div className="text-[11px] text-emerald-400">পরিশোধিত</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Link
                        to={`/orders/${ord.id}`}
                        className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition font-medium text-xs inline-flex items-center gap-1"
                      >
                        <span>বিস্তারিত</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Stage Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Stage Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base">প্রোডাকশন পর্যায়ভিত্তিক বিশ্লেষণ</h3>
            <span className="text-xs text-slate-400">{dateDisplayTitle}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${formatBengaliNumber(val)} টি`, 'সংখ্যা']}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-1">অর্ডার ক্যাটাগরি বণ্টন</h3>
            <span className="text-xs text-slate-400">
              {categoryBreakdown.length > 0 ? dateDisplayTitle : 'এই সময়ে অর্ডার নেই'}
            </span>
          </div>
          <div className="h-48 w-full flex items-center justify-center">
            {categoryBreakdown.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-8">
                নির্বাচিত তারিখে অর্ডার যুক্ত থাকলে ক্যাটাগরি অনুযায়ী গ্রাফ দেখা যাবে।
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    formatter={(val: any) => [`${formatBengaliNumber(val)} টি`, 'অর্ডার']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 min-h-[40px]">
            {categoryBreakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-300">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lifetime Studio Accounts Accordion (Expandable) */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <button
          onClick={() => setShowLifetimeSection(!showLifetimeSection)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/30 transition"
        >
          <div className="flex items-center gap-3">
            <Coins className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-base">সার্বিক স্টুডিও লাইফটাইম হিসাব ও তহবিল স্থিতি</h3>
              <p className="text-xs text-slate-400">স্টুডিওর সর্বমোট আদায়, বকেয়া, খরচ ও ক্যাশ ব্যালেন্স</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
            <span>{showLifetimeSection ? 'সংক্ষেপ করুন' : 'বিস্তারিত দেখুন'}</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showLifetimeSection ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {showLifetimeSection && (
          <div className="p-5 pt-0 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <StatCard
              title="সর্বমোট আদায়কৃত পেমেন্ট"
              value={lifetimeStats.totalReceivedPayments}
              subValue="লাইফটাইম ক্যাশ ও অনলাইন জমা"
              icon={Wallet}
              colorScheme="emerald"
              isCurrency
            />
            <StatCard
              title="সর্বমোট বকেয়া প্রাপ্য"
              value={lifetimeStats.totalOutstandingBalances}
              subValue="ক্লায়েন্টদের কাছে অবশিষ্ট বকেয়া"
              icon={AlertCircle}
              colorScheme="amber"
              isCurrency
            />
            <StatCard
              title="সর্বমোট স্টুডিও ব্যয়"
              value={lifetimeStats.totalExpenses}
              subValue="ভাড়া, বিল, বেতন ও স্টুডিও সামগ্রী"
              icon={TrendingUp}
              colorScheme="rose"
              isCurrency
            />
            <StatCard
              title="নেট ক্যাশ ব্যালেন্স"
              value={lifetimeStats.netCashBalance}
              subValue="প্রাপ্ত পেমেন্ট হতে ব্যয় বাদে স্থিতি"
              icon={ArrowUpRight}
              colorScheme="blue"
              isCurrency
            />
          </div>
        )}
      </div>
    </div>
  )
}
