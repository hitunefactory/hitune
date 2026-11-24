import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { StatCard } from '../../components/dashboard/StatCard'
import { StatusBadge, PriorityBadge } from '../../components/ui/StatusBadge'
import { dataService } from '../../services/dataService'
import { Order } from '../../types/database'
import { formatBengaliNumber, formatBengaliDate, formatCurrency } from '../../lib/utils'
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

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ name: string; value: number; color: string }[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const dashboardStats = await dataService.getDashboardStats()
      const allOrders = await dataService.getOrders()
      setStats(dashboardStats)
      setRecentOrders(allOrders.slice(0, 5))

      // Dynamic Category Breakdown from real orders
      const catCountMap: Record<string, number> = {}
      allOrders.forEach((o) => {
        const catName = o.category?.name_bn || 'অন্যান্য'
        catCountMap[catName] = (catCountMap[catName] || 0) + 1
      })

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
      const breakdown = Object.entries(catCountMap).map(([name, count], idx) => ({
        name,
        value: count,
        color: colors[idx % colors.length],
      }))
      setCategoryBreakdown(breakdown)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    const handleSync = () => {
      loadDashboardData()
    }
    window.addEventListener('hitune:data-synced', handleSync)
    return () => window.removeEventListener('hitune:data-synced', handleSync)
  }, [])

  if (loading || !stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">ড্যাশবোর্ড তথ্য লোড হচ্ছে...</span>
      </div>
    )
  }

  // Chart data
  const productionChartData = [
    { name: 'নতুন', count: stats.newOrders },
    { name: 'পেন্ডিং', count: stats.pendingOrders },
    { name: 'অডিও কাজ', count: stats.audioInProgress },
    { name: 'ভিডিও কাজ', count: stats.videoInProgress },
    { name: 'রিভিশন', count: stats.revisionNeeded },
    { name: 'ডেলিভারি অপেক্ষা', count: stats.readyForDelivery },
    { name: 'ডেলিভার্ড', count: stats.delivered },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
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
              রিয়েল-টাইম প্রোডাকশন স্থিতি, অডিও ও ভিডিও ডিপার্টমেন্টের ওয়ার্কফ্লো এবং হিসাব নিরীক্ষণ।
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

      {/* Production Status Metric Grid */}
      <div>
        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-400" />
          <span>অর্ডার ও প্রোডাকশন সামগ্রিক স্থিতি</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
          <StatCard
            title="মোট অর্ডার"
            value={stats.totalOrders}
            icon={FolderKanban}
            colorScheme="blue"
          />
          <StatCard
            title="নতুন অর্ডার"
            value={stats.newOrders}
            icon={Sparkles}
            colorScheme="cyan"
          />
          <StatCard
            title="পেন্ডিং অর্ডার"
            value={stats.pendingOrders}
            icon={Clock}
            colorScheme="amber"
          />
          <StatCard
            title="অডিও চলমান"
            value={stats.audioInProgress}
            icon={Headphones}
            colorScheme="blue"
          />
          <StatCard
            title="অডিও সম্পন্ন"
            value={stats.audioCompleted}
            icon={CheckCircle}
            colorScheme="emerald"
          />
          <StatCard
            title="ভিডিও চলমান"
            value={stats.videoInProgress}
            icon={Video}
            colorScheme="cyan"
          />
          <StatCard
            title="ভিডিও সম্পন্ন"
            value={stats.videoCompleted}
            icon={CheckCircle}
            colorScheme="emerald"
          />
          <StatCard
            title="রিভিশন প্রয়োজন"
            value={stats.revisionNeeded}
            icon={AlertCircle}
            colorScheme="rose"
          />
          <StatCard
            title="ডেলিভারির অপেক্ষায়"
            value={stats.readyForDelivery}
            icon={Truck}
            colorScheme="amber"
          />
          <StatCard
            title="ডেলিভারি সম্পন্ন"
            value={stats.delivered}
            icon={CheckCheck}
            colorScheme="emerald"
          />
          <StatCard
            title="বাতিল অর্ডার"
            value={stats.cancelled}
            icon={XCircle}
            colorScheme="rose"
          />
          <StatCard
            title="আজকের নতুন অর্ডার"
            value={stats.todayOrdersCount}
            icon={Calendar}
            colorScheme="purple"
          />
        </div>
      </div>

      {/* Accounting & Financial Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="মোট আদায়কৃত পেমেন্ট"
          value={stats.totalReceivedPayments}
          subValue="যাচাইকৃত ক্যাশ ও অনলাইন জমা"
          icon={Wallet}
          colorScheme="emerald"
          isCurrency
        />
        <StatCard
          title="বকেয়া প্রাপ্য টাকা"
          value={stats.totalOutstandingBalances}
          subValue="ক্লায়েন্টদের কাছে অবশিষ্ট বকেয়া"
          icon={AlertCircle}
          colorScheme="amber"
          isCurrency
        />
        <StatCard
          title="মোট স্টুডিও ব্যয়"
          value={stats.totalExpenses}
          subValue="ভাড়া, বিল, বেতন ও স্টুডিও সামগ্রী"
          icon={TrendingUp}
          colorScheme="rose"
          isCurrency
        />
        <StatCard
          title="নেট ক্যাশ স্থিতি"
          value={stats.netCashBalance}
          subValue="প্রাপ্ত পেমেন্ট হতে ব্যয় বাদে স্থিতি"
          icon={ArrowUpRight}
          colorScheme="blue"
          isCurrency
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Stage Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base">প্রোডাকশন পর্যায়ভিত্তিক বিশ্লেষণ</h3>
            <span className="text-xs text-slate-400">লাইভ ডাটাবেজ তথ্য</span>
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
              {categoryBreakdown.length > 0 ? 'চলমান ক্যাটাগরি তালিকা' : 'এখনো অর্ডার এন্ট্রি করা হয়নি'}
            </span>
          </div>
          <div className="h-48 w-full flex items-center justify-center">
            {categoryBreakdown.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-8">
                নতুন অর্ডার যুক্ত হলে ক্যাটাগরি অনুযায়ী গ্রাফ তৈরি হবে।
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

      {/* Recent Orders Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">সাম্প্রতিক অর্ডার ও স্ট্যাটাস</h3>
            <p className="text-xs text-slate-400 mt-0.5">গৃহীত অর্ডারের লাইভ ওয়ার্কফ্লো মনিটরিং</p>
          </div>
          <Link
            to="/orders"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
          >
            <span>সব দেখুন</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1120]/70 text-slate-400 border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-4 font-semibold">অর্ডার নং</th>
                <th className="py-3 px-4 font-semibold">কাজের শিরোনাম ও বিবরণ</th>
                <th className="py-3 px-4 font-semibold">ক্লায়েন্ট ও ফোন</th>
                <th className="py-3 px-4 font-semibold">অগ্রাধিকার</th>
                <th className="py-3 px-4 font-semibold">ডেডলাইন</th>
                <th className="py-3 px-4 font-semibold">প্রোডাকশন স্থিতি</th>
                <th className="py-3 px-4 font-semibold text-right">মোট / বকেয়া</th>
                <th className="py-3 px-4 font-semibold text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    বর্তমানে কোনো সক্রিয় অর্ডার নেই। "+ নতুন অর্ডার গ্রহণ" বাটনে ক্লিক করে প্রথম অর্ডার এন্ট্রি করুন।
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      {ord.order_number}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <div className="font-medium text-slate-100 truncate">{ord.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{ord.category?.name_bn || 'কাস্টম'}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{ord.client_name}</div>
                      <div className="text-[11px] text-slate-400">{ord.client_phone}</div>
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
    </div>
  )
}
