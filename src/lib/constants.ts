import { UserRole, OrderOverallStatus, OrderPriority, PaymentStatus, PaymentMethod } from '../types/database'

export const ROLE_LABELS_BN: Record<UserRole, { title: string; color: string; desc: string }> = {
  SUPER_ADMIN: {
    title: 'সুপার অ্যাডমিন',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    desc: 'পূর্ণ নিয়ন্ত্রণ ও পরিচালনা',
  },
  ORDER_MANAGER: {
    title: 'অর্ডার ম্যানেজার',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    desc: 'অর্ডার তৈরি ও টিম সমন্বয়',
  },
  AUDIO_DESIGNER: {
    title: 'অডিও ডিজাইনার',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    desc: 'ভয়েস ও অডিও প্রোডাকশন',
  },
  VIDEO_EDITOR: {
    title: 'ভিডিও এডিটর',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    desc: 'ভিডিও সম্পাদনা ও ভিজ্যুয়াল',
  },
  QUALITY_CONTROLLER: {
    title: 'কোয়ালিটি কন্ট্রোলার',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    desc: 'মান নিয়ন্ত্রণ ও অনুমোদন',
  },
  DELIVERY_MANAGER: {
    title: 'ডেলিভারি ম্যানেজার',
    color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    desc: 'চূড়ান্ত ফাইল বিতরণ',
  },
  ACCOUNTANT: {
    title: 'অ্যাকাউন্ট্যান্ট',
    color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    desc: 'হিসাব, আয় ও ব্যয় ব্যবস্থাপনা',
  },
}

export const STATUS_MAP_BN: Record<OrderOverallStatus, { label: string; color: string; badge: string; step: number }> = {
  NEW: {
    label: 'নতুন অর্ডার',
    color: 'text-blue-400',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    step: 1,
  },
  AUDIO_PENDING: {
    label: 'অডিও পেন্ডিং',
    color: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    step: 2,
  },
  AUDIO_IN_PROGRESS: {
    label: 'অডিও চলমান',
    color: 'text-blue-400',
    badge: 'bg-blue-600/20 text-blue-300 border-blue-500/40 animate-pulse',
    step: 3,
  },
  AUDIO_SUBMITTED: {
    label: 'অডিও সাবমিট হয়েছে',
    color: 'text-indigo-400',
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    step: 4,
  },
  AUDIO_QC: {
    label: 'অডিও কোয়ালিটি চেক',
    color: 'text-purple-400',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    step: 5,
  },
  AUDIO_REVISION: {
    label: 'অডিও রিভিশন প্রয়োজন',
    color: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    step: 3,
  },
  VIDEO_PENDING: {
    label: 'ভিডিওর অপেক্ষায়',
    color: 'text-cyan-400',
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    step: 6,
  },
  VIDEO_IN_PROGRESS: {
    label: 'ভিডিও চলমান',
    color: 'text-teal-400',
    badge: 'bg-teal-600/20 text-teal-300 border-teal-500/40 animate-pulse',
    step: 7,
  },
  VIDEO_SUBMITTED: {
    label: 'ভিডিও সাবমিট হয়েছে',
    color: 'text-sky-400',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    step: 8,
  },
  VIDEO_QC: {
    label: 'ভিডিও কোয়ালিটি চেক',
    color: 'text-purple-400',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    step: 9,
  },
  VIDEO_REVISION: {
    label: 'ভিডিও রিভিশন প্রয়োজন',
    color: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    step: 7,
  },
  READY_FOR_DELIVERY: {
    label: 'ডেলিভারির অপেক্ষায়',
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-medium',
    step: 10,
  },
  DELIVERED: {
    label: 'ডেলিভারি সম্পন্ন',
    color: 'text-green-400',
    badge: 'bg-green-500/20 text-green-400 border-green-500/30 font-semibold',
    step: 11,
  },
  CANCELLED: {
    label: 'বাতিলকৃত',
    color: 'text-slate-400',
    badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    step: 0,
  },
}

export const PRIORITY_MAP_BN: Record<OrderPriority, { label: string; badge: string }> = {
  LOW: { label: 'সাধারণ (Low)', badge: 'bg-slate-700/50 text-slate-300 border-slate-600' },
  NORMAL: { label: 'স্বাভাবিক (Normal)', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  HIGH: { label: 'জরুরি (High)', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-medium' },
  URGENT: { label: 'অতি জরুরি (Urgent)', badge: 'bg-red-500/20 text-red-400 border-red-500/40 font-semibold animate-pulse' },
}

export const PAYMENT_STATUS_MAP_BN: Record<PaymentStatus, { label: string; badge: string }> = {
  UNPAID: { label: 'অপরিশোধিত', badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
  PARTIAL: { label: 'আংশিক পরিশোধ', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  PAID: { label: 'পরিশোধিত', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
}

export const PAYMENT_METHOD_MAP_BN: Record<PaymentMethod, string> = {
  CASH: 'নগদ ক্যাশ (Cash)',
  BKASH: 'বিকাশ (bKash)',
  NAGAD: 'নগদ (Nagad)',
  BANK: 'ব্যাংক ট্রান্সফার (Bank)',
  OTHER: 'অন্যান্য',
}
