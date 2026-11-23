import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num).replace('BDT', '৳')
}

export function formatBengaliNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '০'
  const banglaDigits: { [key: string]: string } = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  }
  return num.toString().replace(/[0-9]/g, (w) => banglaDigits[w] || w)
}

export function formatBengaliDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return '—'
  
  const banglaMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ]
  
  const day = formatBengaliNumber(date.getDate())
  const month = banglaMonths[date.getMonth()]
  const year = formatBengaliNumber(date.getFullYear())
  
  return `${day} ${month}, ${year}`
}
