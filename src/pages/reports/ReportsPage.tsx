import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react'
import { dataService } from '../../services/dataService'
import { Order, Payment, Expense } from '../../types/database'
import { formatBengaliDate, formatBengaliNumber, formatCurrency } from '../../lib/utils'

export const ReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const [reportType, setReportType] = useState<string>('ORDERS')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [ord, pay, exp] = await Promise.all([
          dataService.getOrders(),
          dataService.getPayments(),
          dataService.getExpenses(),
        ])
        setOrders(ord)
        setPayments(pay)
        setExpenses(exp)
      } catch (err) {
        console.error('Failed to load reports:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
    if (reportType === 'ORDERS') {
      csvContent += 'Order Number,Title,Client,Phone,Category,Status,Total Price,Due Amount\n'
      orders.forEach((o) => {
        csvContent += `"${o.order_number}","${o.title}","${o.client_name}","${o.client_phone}","${o.category?.name_bn}","${o.overall_status}","${o.total_amount}","${o.due_amount}"\n`
      })
    } else if (reportType === 'INCOME') {
      csvContent += 'Date,Order Number,Method,Reference,Amount\n'
      payments.forEach((p) => {
        csvContent += `"${p.payment_date}","${p.order_number || ''}","${p.payment_method}","${p.transaction_reference || ''}","${p.amount}"\n`
      })
    } else {
      csvContent += 'Date,Title,Category,Method,Amount\n'
      expenses.forEach((e) => {
        csvContent += `"${e.expense_date}","${e.title}","${e.category?.name_bn}","${e.payment_method}","${e.amount}"\n`
      })
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `hitune_${reportType.toLowerCase()}_report.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            <span>রিপোর্ট ও বিশ্লেষণ</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <Download className="h-4 w-4" />
            <span>CSV ডাউনলোড</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-blue-600/30"
          >
            <Printer className="h-4 w-4" />
            <span>রিপোর্ট প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Report Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'ORDERS', label: 'সকল অর্ডার রিপোর্ট' },
          { key: 'INCOME', label: 'পেমেন্ট আয় বিবরণী' },
          { key: 'EXPENSES', label: 'স্টুডিও ব্যয় রিপোর্ট' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setReportType(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              reportType === tab.key
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Printable Report Card */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 print:p-0 print:border-none print:bg-white print:text-black">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white print:text-black">HI TUNE STUDIO</h2>
            <p className="text-xs text-slate-400 print:text-gray-600">জামালপুর, বাংলাদেশ | অফিশিয়াল কার্যবিবরণী</p>
          </div>
          <span className="text-xs text-slate-400">তারিখ: {formatBengaliDate(new Date())}</span>
        </div>

        {/* Dynamic Table */}
        {reportType === 'ORDERS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1120] text-slate-400 border-b border-slate-800 print:bg-gray-100 print:text-black">
                <tr>
                  <th className="py-2.5 px-3 whitespace-nowrap">কাজের শিরোনাম</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">ক্লায়েন্ট</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">স্ট্যাটাস</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">অর্ডার নং</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">ক্যাটাগরি</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">মূল্য</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">বকেয়া</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 print:divide-gray-300 print:text-black">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2 px-3 font-medium">{o.title}</td>
                    <td className="py-2 px-3">{o.client_name} ({o.client_phone})</td>
                    <td className="py-2 px-3">{o.overall_status}</td>
                    <td className="py-2 px-3 font-semibold">{o.order_number}</td>
                    <td className="py-2 px-3">{o.category?.name_bn}</td>
                    <td className="py-2 px-3 text-right font-medium">{formatCurrency(o.total_amount)}</td>
                    <td className="py-2 px-3 text-right font-medium text-amber-400 print:text-black">{formatCurrency(o.due_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'INCOME' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1120] text-slate-400 border-b border-slate-800 print:bg-gray-100 print:text-black">
                <tr>
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3">অর্ডার নং</th>
                  <th className="py-2.5 px-3">মাধ্যম</th>
                  <th className="py-2.5 px-3">রেফারেন্স নং</th>
                  <th className="py-2.5 px-3 text-right">টাকার পরিমাণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 print:divide-gray-300 print:text-black">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 px-3">{formatBengaliDate(p.payment_date)}</td>
                    <td className="py-2 px-3 font-semibold">{p.order_number}</td>
                    <td className="py-2 px-3">{p.payment_method}</td>
                    <td className="py-2 px-3">{p.transaction_reference || '—'}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-400 print:text-black">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'EXPENSES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1120] text-slate-400 border-b border-slate-800 print:bg-gray-100 print:text-black">
                <tr>
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3">ব্যয়ের বিবরণ</th>
                  <th className="py-2.5 px-3">ক্যাটাগরি</th>
                  <th className="py-2.5 px-3">পদ্ধতি</th>
                  <th className="py-2.5 px-3 text-right">টাকার পরিমাণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 print:divide-gray-300 print:text-black">
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 px-3">{formatBengaliDate(e.expense_date)}</td>
                    <td className="py-2 px-3 font-semibold">{e.title}</td>
                    <td className="py-2 px-3">{e.category?.name_bn}</td>
                    <td className="py-2 px-3">{e.payment_method}</td>
                    <td className="py-2 px-3 text-right font-bold text-rose-400 print:text-black">{formatCurrency(e.amount)}</td>
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
