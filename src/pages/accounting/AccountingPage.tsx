import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Wallet,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  Receipt,
  FileSpreadsheet,
  Calendar,
  Layers,
  ArrowUpRight,
  CreditCard,
  Building2,
  CheckCircle,
} from 'lucide-react'
import { dataService } from '../../services/dataService'
import { Payment, Expense, ExpenseCategory, Order, PaymentMethod } from '../../types/database'
import { useAuth } from '../../contexts/AuthContext'
import { formatBengaliDate, formatBengaliNumber, formatCurrency, getLocalDateString } from '../../lib/utils'
import { PAYMENT_METHOD_MAP_BN } from '../../lib/constants'
import { useBackOverlay } from '../../hooks/useBackOverlay'

export const AccountingPage: React.FC = () => {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Active view tab
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<'income' | 'expenses' | 'summary'>(
    tabParam === 'income' || tabParam === 'expenses' || tabParam === 'summary' ? tabParam : 'summary'
  )

  useEffect(() => {
    if (tabParam === 'income' || tabParam === 'expenses' || tabParam === 'summary') {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [payAmount, setPayAmount] = useState<number>(0)
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH')
  const [payRef, setPayRef] = useState('')
  const [payNotes, setPayNotes] = useState('')

  // Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expTitle, setExpTitle] = useState('')
  const [expAmount, setExpAmount] = useState<number>(0)
  const [expCatId, setExpCatId] = useState('')
  const [expMethod, setExpMethod] = useState<PaymentMethod>('CASH')
  const [expDate, setExpDate] = useState(() => getLocalDateString(new Date()))
  const [expNotes, setExpNotes] = useState('')

  // Custom Category Modal
  const [showCatModal, setShowCatModal] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatBn, setNewCatBn] = useState('')

  useBackOverlay(showPaymentModal, () => setShowPaymentModal(false))
  useBackOverlay(showExpenseModal, () => setShowExpenseModal(false))
  useBackOverlay(showCatModal, () => setShowCatModal(false))

  const loadFinancialData = async () => {
    setLoading(true)
    try {
      const [payList, expList, expCats, ordList] = await Promise.all([
        dataService.getPayments(),
        dataService.getExpenses(),
        dataService.getExpenseCategories(),
        dataService.getOrders(),
      ])
      setPayments(payList)
      setExpenses(expList)
      setExpenseCategories(expCats)
      setOrders(ordList)

      if (ordList.length > 0) setSelectedOrderId(ordList[0].id)
      if (expCats.length > 0) setExpCatId(expCats[0].id)
    } catch (err) {
      console.error('Failed to load financials:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFinancialData()
  }, [])

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrderId || payAmount <= 0) return

    const targetOrder = orders.find((o) => o.id === selectedOrderId)
    try {
      await dataService.recordPayment({
        order_id: selectedOrderId,
        order_number: targetOrder?.order_number,
        amount: Number(payAmount),
        payment_method: payMethod,
        transaction_reference: payRef,
        notes: payNotes,
        recorded_by: user?.id,
      })
      setShowPaymentModal(false)
      setPayAmount(0)
      setPayRef('')
      setPayNotes('')
      loadFinancialData()
    } catch (err) {
      console.error('Record payment failed:', err)
    }
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expTitle.trim() || expAmount <= 0) return

    try {
      await dataService.recordExpense({
        category_id: expCatId,
        title: expTitle.trim(),
        amount: Number(expAmount),
        expense_date: expDate,
        payment_method: expMethod,
        notes: expNotes,
        recorded_by: user?.id,
      })
      setShowExpenseModal(false)
      setExpTitle('')
      setExpAmount(0)
      setExpNotes('')
      loadFinancialData()
    } catch (err) {
      console.error('Record expense failed:', err)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim() || !newCatBn.trim()) return

    try {
      await dataService.createExpenseCategory(newCatName.trim(), newCatBn.trim())
      setShowCatModal(false)
      setNewCatName('')
      setNewCatBn('')
      loadFinancialData()
    } catch (err) {
      console.error('Add category failed:', err)
    }
  }

  // Financial Calculations
  const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalDue = orders.reduce((sum, o) => sum + Number(o.due_amount), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const netCash = totalReceived - totalExpenses

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-emerald-400" />
            <span>হিসাব ও পেমেন্ট</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-md transition"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন খরচ</span>
          </button>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition"
          >
            <Plus className="h-4 w-4" />
            <span>পেমেন্ট রসিদ</span>
          </button>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600/15 to-emerald-500/5 border border-emerald-500/30 space-y-1 shadow-lg">
          <span className="text-xs text-emerald-300 font-medium block">আদায়কৃত পেমেন্ট</span>
          <div className="text-xl sm:text-2xl font-bold text-white flex items-baseline gap-1">
            <span className="text-emerald-400">৳</span>
            <span>{formatBengaliNumber(totalReceived)}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-600/15 to-amber-500/5 border border-amber-500/30 space-y-1 shadow-lg">
          <span className="text-xs text-amber-300 font-medium block">বকেয়া টাকা</span>
          <div className="text-xl sm:text-2xl font-bold text-white flex items-baseline gap-1">
            <span className="text-amber-400">৳</span>
            <span>{formatBengaliNumber(totalDue)}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-600/15 to-rose-500/5 border border-rose-500/30 space-y-1 shadow-lg">
          <span className="text-xs text-rose-300 font-medium block">মোট খরচ</span>
          <div className="text-xl sm:text-2xl font-bold text-white flex items-baseline gap-1">
            <span className="text-rose-400">৳</span>
            <span>{formatBengaliNumber(totalExpenses)}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/15 to-blue-500/5 border border-blue-500/30 space-y-1 shadow-lg">
          <span className="text-xs text-blue-300 font-medium block">নেট ব্যালেন্স</span>
          <div className="text-xl sm:text-2xl font-bold text-white flex items-baseline gap-1">
            <span className="text-blue-400">৳</span>
            <span>{formatBengaliNumber(netCash)}</span>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'summary'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          আয়-ব্যয় সামগ্রিক বিবরণ
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'income'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>পেমেন্ট প্রাপ্তি খাতা</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-[10px]">
            {formatBengaliNumber(payments.length)}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'expenses'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>স্টুডিও ব্যয় ভাউচার</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-[10px]">
            {formatBengaliNumber(expenses.length)}
          </span>
        </button>
      </div>

      {/* TAB 1: SUMMARY */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Income List */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-400" />
                <span>সর্বশেষ পেমেন্ট জমা</span>
              </h3>
              <span className="text-xs text-emerald-400 font-semibold">{formatCurrency(totalReceived)}</span>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto pr-1">
              {payments.slice(0, 5).map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{p.order_number || 'অর্ডার পেমেন্ট'}</div>
                    <div className="text-[11px] text-slate-400">
                      {PAYMENT_METHOD_MAP_BN[p.payment_method]} • {formatBengaliDate(p.payment_date)}
                    </div>
                  </div>
                  <div className="font-bold text-emerald-400 text-sm">
                    +{formatCurrency(p.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Expenses List */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-rose-400" />
                <span>সর্বশেষ খরচ ভাউচার</span>
              </h3>
              <span className="text-xs text-rose-400 font-semibold">{formatCurrency(totalExpenses)}</span>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto pr-1">
              {expenses.slice(0, 5).map((e) => (
                <div key={e.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{e.title}</div>
                    <div className="text-[11px] text-slate-400">
                      {e.category?.name_bn} • {PAYMENT_METHOD_MAP_BN[e.payment_method]} • {formatBengaliDate(e.expense_date)}
                    </div>
                  </div>
                  <div className="font-bold text-rose-400 text-sm">
                    -{formatCurrency(e.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENTS LIST */}
      {activeTab === 'income' && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">সকল পেমেন্ট প্রাপ্তি বিবরণী</h3>
            <span className="text-xs text-slate-400">মোট প্রাপ্তি: {formatCurrency(totalReceived)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1120]/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">তারিখ</th>
                  <th className="py-3 px-4 font-semibold">অর্ডার নং</th>
                  <th className="py-3 px-4 font-semibold">পেমেন্ট মাধ্যম</th>
                  <th className="py-3 px-4 font-semibold">ট্রানজেকশন রেফারেন্স</th>
                  <th className="py-3 px-4 font-semibold">মন্তব্য</th>
                  <th className="py-3 px-4 font-semibold text-right">টাকা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {formatBengaliDate(p.payment_date)}
                    </td>
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      {p.order_number || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {PAYMENT_METHOD_MAP_BN[p.payment_method]}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono">
                      {p.transaction_reference || '—'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-400">
                      {p.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-emerald-400">
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSES LIST */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">স্টুডিও খরচের ভাউচার তালিকা</h3>
            <button
              onClick={() => setShowCatModal(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              + নতুন ব্যয় ক্যাটাগরি তৈরি
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1120]/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">তারিখ</th>
                    <th className="py-3 px-4 font-semibold">ব্যয়ের শিরোনাম</th>
                    <th className="py-3 px-4 font-semibold">ক্যাটাগরি</th>
                    <th className="py-3 px-4 font-semibold">মাধ্যম</th>
                    <th className="py-3 px-4 font-semibold">মন্তব্য</th>
                    <th className="py-3 px-4 font-semibold text-right">খরচের পরিমাণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        {formatBengaliDate(e.expense_date)}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {e.title}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {e.category?.name_bn || 'অন্যান্য'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        {PAYMENT_METHOD_MAP_BN[e.payment_method]}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-400">
                        {e.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-rose-400">
                        {formatCurrency(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">নতুন পেমেন্ট রসিদ তৈরি</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">অর্ডার নির্বাচন করুন</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number}: {o.title} (বকেয়া: {formatCurrency(o.due_amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  min="1"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">পেমেন্ট মাধ্যম</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  {Object.entries(PAYMENT_METHOD_MAP_BN).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">রেফারেন্স / ট্রানজেকশন আইডি</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="TRX-12345"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">মন্তব্য</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="বকেয়া আদায়"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  পেমেন্ট জমা করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">নতুন স্টুডিও ব্যয় রেকর্ড</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">ব্যয়ের বিবরণ / শিরোনাম</label>
                <input
                  type="text"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="যেমন: স্টুডিও বিদ্যুৎ বিল বা যন্ত্রপাতি ক্রয়"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">ক্যাটাগরি</label>
                <select
                  value={expCatId}
                  onChange={(e) => setExpCatId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_bn}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  min="1"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-rose-400 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">তারিখ</label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">পেমেন্ট মাধ্যম</label>
                <select
                  value={expMethod}
                  onChange={(e) => setExpMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  {Object.entries(PAYMENT_METHOD_MAP_BN).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
                >
                  খরচ সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">নতুন ব্যয় ক্যাটাগরি তৈরি</h3>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">ইংরেজি নাম</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Generator Fuel"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">বাংলা নাম</label>
                <input
                  type="text"
                  value={newCatBn}
                  onChange={(e) => setNewCatBn(e.target.value)}
                  placeholder="জেনারেটর জ্বালানি খরচ"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                >
                  ক্যাটাগরি যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
