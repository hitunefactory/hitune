import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  Mail,
  User,
  Phone,
  Shield,
  Upload,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { UserAvatar } from '../ui/UserAvatar'
import { ROLE_LABELS_BN } from '../../lib/constants'
import { useBackOverlay } from '../../hooks/useBackOverlay'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

// Compress image in browser to max 320x320 for ultra-fast storage and crisp avatar display
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxDim = 320
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.88))
        } else {
          resolve(img.src)
        }
      }
      img.onerror = () => reject(new Error('ছবি লোড করা যায়নি'))
    }
    reader.onerror = () => reject(new Error('ফাইল পড়তে সমস্যা হয়েছে'))
  })
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, currentRole, updateUserProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(user?.full_name || '')
  const [bengaliName, setBengaliName] = useState(user?.bengali_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null)

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useBackOverlay(isOpen && Boolean(user), onClose)

  if (!isOpen || !user) return null

  // Handle local photo upload with canvas compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('ছবির আকার সর্বোচ্চ ১০ মেগাবাইট (10MB) হতে পারবে।')
      return
    }

    try {
      const compressedDataUrl = await compressImage(file)
      setAvatarPreview(compressedDataUrl)
      setError('')
    } catch (err: any) {
      setError(err?.message || 'ছবি প্রসেস করতে সমস্যা হয়েছে')
    }
  }

  const handleRemovePhoto = () => {
    setAvatarPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const res = await updateUserProfile({
        fullName: fullName.trim(),
        bengaliName: bengaliName.trim() || fullName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarPreview || '',
      })

      if (res.success) {
        setSuccess('প্রোফাইল ও ছবি সফলভাবে সংরক্ষণ করা হয়েছে!')
        setTimeout(() => {
          setSuccess('')
          onClose()
        }, 1200)
      } else {
        setError(res.error || 'আপডেট করতে সমস্যা হয়েছে')
      }
    } catch (err: any) {
      setError(err?.message || 'আপডেট করা সম্ভব হয়নি')
    } finally {
      setSubmitting(false)
    }
  }

  const roleInfo = ROLE_LABELS_BN[currentRole] || ROLE_LABELS_BN.AUDIO_DESIGNER

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Modal Dialog Card */}
      <div
        className="bg-[#0f172a] border border-slate-700/80 rounded-3xl max-w-lg w-full my-auto shadow-2xl shadow-black/80 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Pinned Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0b1120]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center ring-1 ring-blue-500/30">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>আমার প্রোফাইল ও ছবি</span>
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              </h2>
              <p className="text-[11px] text-slate-400">নিজের ছবি আপলোড ও ব্যক্তিগত তথ্য পরিচালনা করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Prominent Photo Upload Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-blue-500/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-blue-400" />
                <span>প্রোফাইল ছবি যুক্ত করুন</span>
              </span>
              <span className="text-[10px] text-slate-400">JPG, PNG, WebP</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              {/* Avatar Preview with Camera badge */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer group shrink-0"
                title="ছবি পরিবর্তন করতে ক্লিক করুন"
              >
                <UserAvatar
                  src={avatarPreview}
                  name={bengaliName || fullName || 'User'}
                  size="xl"
                  className="ring-4 ring-blue-500/40 shadow-xl"
                />
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition duration-200">
                  <Camera className="h-6 w-6" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-600 border-2 border-[#0f172a] text-white flex items-center justify-center shadow">
                  <Camera className="h-3 w-3" />
                </div>
              </div>

              {/* Upload & Remove Buttons */}
              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition transform active:scale-95 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>কম্পিউটার/মোবাইল থেকে ছবি পছন্দ করুন</span>
                  </button>

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-medium border border-rose-500/20 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ছবি সরান</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  আপনার ছবি স্বয়ংক্রিয়ভাবে অপ্টিমাইজ হয়ে সংরক্ষণ হবে।
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">বাংলা নাম</label>
              <input
                type="text"
                value={bengaliName}
                onChange={(e) => setBengaliName(e.target.value)}
                placeholder="যেমন: আব্দুল্লাহ আল মামুন"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ইংরেজি নাম</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Abdullah Al Mamun"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ইমেইল (লগইন আইডি)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed select-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">মোবাইল নম্বর</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Current Role Banner */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-slate-400">নির্ধারিত ভূমিকা:</span>
              <span className="font-bold text-white">{roleInfo.title}</span>
            </div>
            <span className="text-[11px] text-slate-500">{user.department || 'সাধারণ'} বিভাগ</span>
          </div>

          {/* Pinned Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition cursor-pointer"
            >
              বাতিল
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{submitting ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}
