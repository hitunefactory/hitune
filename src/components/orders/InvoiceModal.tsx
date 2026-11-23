import React from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, Download, Sparkles, Building2, Phone, Mail, MapPin } from 'lucide-react'
import { Order } from '../../types/database'
import { formatBengaliDate, formatBengaliNumber, formatCurrency } from '../../lib/utils'
import { STATUS_MAP_BN } from '../../lib/constants'

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, order }) => {
  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto invoice-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-[#0f172a] border border-slate-700/80 rounded-3xl max-w-2xl w-full my-auto shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 printable-invoice-wrapper"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden during print) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0b1120] no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>গ্রাহক ইনভয়েস ও মানি রসিদ প্রিভিউ</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition transform active:scale-95 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>প্রিন্ট / PDF সংরক্ষণ</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Memo Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 printable-invoice-area bg-white text-slate-900 rounded-b-3xl">
          {/* Invoice Header */}
          <div className="border-b-2 border-blue-900 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-blue-900 text-white font-extrabold flex items-center justify-center text-lg shadow">
                  HT
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-blue-950 uppercase">
                    HI TUNE STUDIO
                  </h1>
                  <p className="text-xs font-semibold text-blue-700">
                    স্মার্ট অডিও ও ভিডিও প্রোডাকশন হাউজ
                  </p>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                <p className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-blue-700 shrink-0" />
                  <span>জামালপুর সদর, জামালপুর, বাংলাদেশ</span>
                </p>
                <p className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-blue-700 shrink-0" />
                  <span>মোবাইল: ০১৭১২-৫০৫১৪৫, ০১৬১২-৫০৫১৪৫</span>
                </p>
                <p className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-blue-700 shrink-0" />
                  <span>ইমেইল: hitunefactory@gmail.com</span>
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-900 font-bold text-xs rounded-full border border-blue-300">
                অফিশিয়াল ক্যাশ মেমো / রসিদ
              </span>
              <p className="text-xs text-slate-700 font-bold mt-1">
                অর্ডার নং: <span className="text-blue-900 font-mono">{order.order_number}</span>
              </p>
              <p className="text-[11px] text-slate-500">
                ইস্যু তারিখ: {formatBengaliDate(new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Client & Order Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                গ্রাহক / ক্লায়েন্টের তথ্য:
              </span>
              <p className="font-bold text-sm text-slate-900">{order.client_name}</p>
              <p className="text-slate-700 font-medium">মোবাইল: {order.client_phone}</p>
              {order.client_address && (
                <p className="text-slate-600">ঠিকানা: {order.client_address}</p>
              )}
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                অর্ডার ও ডেলিভারি বিবরণ:
              </span>
              <p className="font-semibold text-slate-800">
                ক্যাটাগরি: <strong className="text-blue-900">{order.category?.name_bn || 'প্রোডাকশন'}</strong>
              </p>
              <p className="text-slate-700">
                ডেলিভারির তারিখ: <strong>{order.deadline ? formatBengaliDate(order.deadline) : 'নির্ধারিত হয়নি'}</strong>
              </p>
              <p className="text-slate-600">
                বর্তমান স্থিতি: <span className="font-bold text-blue-900">{STATUS_MAP_BN[order.overall_status]?.label}</span>
              </p>
            </div>
          </div>

          {/* Order Item Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3 w-12 text-center">নং</th>
                  <th className="p-3">কাজের বিবরণ ও অর্ডার শিরোনাম</th>
                  <th className="p-3 w-28 text-center">ডিপার্টমেন্ট</th>
                  <th className="p-3 w-32 text-right">মূল্য (টাকা)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="p-3 text-center font-bold">১</td>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{order.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{order.category?.name_bn}</p>
                  </td>
                  <td className="p-3 text-center text-[11px] font-medium text-slate-600">
                    {order.audio_required && order.video_required
                      ? 'অডিও ও ভিডিও'
                      : order.video_required
                      ? 'ভিডিও'
                      : 'অডিও'}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {formatCurrency(order.total_amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Box */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-700 font-medium">
                <span>মোট নির্ধারিত বিল:</span>
                <span className="font-bold text-slate-900">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>অগ্রিম / পরিশোধিত:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(order.paid_amount)}</span>
              </div>
              <div className="border-t-2 border-slate-300 pt-2 flex justify-between text-sm font-bold text-rose-700">
                <span>অবশিষ্ট বকেয়া:</span>
                <span>{formatCurrency(order.due_amount)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Signatures */}
          <div className="pt-8 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-700">
              <div className="space-y-12">
                <div className="border-b border-slate-400 w-36 mx-auto" />
                <p className="font-semibold">গ্রাহকের স্বাক্ষর</p>
              </div>
              <div className="space-y-12">
                <div className="border-b border-slate-400 w-36 mx-auto" />
                <p className="font-bold text-blue-950">HI TUNE STUDIO (কর্তৃপক্ষ)</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-6">
              * এটি HI TUNE STUDIO কর্তৃক ইস্যুকৃত একটি ডিজিটাল ইনভয়েস ও ক্যাশ মেমো। অর্ডার ট্র্যাকিংয়ের জন্য রশিদ নং সংরক্ষণ করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}
