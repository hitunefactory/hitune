import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Music2,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  LogIn,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '../../types/database'
import { ROLE_LABELS_BN } from '../../lib/constants'

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [fullName, setFullName] = useState('')
  const [bengaliName, setBengaliName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('AUDIO_DESIGNER')
  const [department, setDepartment] = useState('AUDIO')

  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setSubmitting(true)

    try {
      const res = await login(loginEmail, loginPassword)
      if (res.success) {
        navigate('/')
      } else {
        setError(res.error || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।')
      }
    } catch (err: any) {
      setError(err?.message || 'লগইন করতে সমস্যা হয়েছে')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Manual Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (regPassword.length < 6) {
      setError('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।')
      return
    }

    if (regPassword !== confirmPassword) {
      setError('পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।')
      return
    }

    setSubmitting(true)

    try {
      const res = await register({
        email: regEmail.trim(),
        password: regPassword,
        fullName: fullName.trim(),
        bengaliName: bengaliName.trim() || fullName.trim(),
        phone: phone.trim(),
        role,
        department,
      })

      if (res.success) {
        setSuccessMsg('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...')
        setTimeout(() => {
          navigate('/')
        }, 1200)
      } else {
        setError(res.error || 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।')
      }
    } catch (err: any) {
      setError(err?.message || 'নিবন্ধন সম্পন্ন করা যায়নি')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Studio Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 text-white shadow-xl shadow-blue-500/30 ring-2 ring-blue-400/30 mb-1">
            <Music2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">HI TUNE STUDIO</h1>
          <p className="text-sm font-semibold text-blue-400">
            স্মার্ট অর্ডার ও প্রোডাকশন ম্যানেজমেন্ট সিস্টেম
          </p>
          <p className="text-xs text-slate-500">জামালপুর, বাংলাদেশ</p>
        </div>

        {/* Auth Box */}
        <div className="bg-[#0b1120]/95 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-2xl bg-slate-950 p-1.5 border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="h-4 w-4" />
              <span>লগইন করুন</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>নতুন অ্যাকাউন্ট তৈরি</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs leading-relaxed flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">ইমেইল ঠিকানা</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your-email@hitunestudio.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">পাসওয়ার্ড</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition transform active:scale-98 flex items-center justify-center gap-2"
              >
                <span>{submitting ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">অ্যাকাউন্ট নেই? </span>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs text-blue-400 hover:underline font-semibold"
                >
                  নতুন স্টাফ অ্যাকাউন্ট তৈরি করুন
                </button>
              </div>
            </form>
          )}

          {/* 2. REGISTRATION FORM (Manual Account Creation) */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    ইংরেজি নাম <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tanvir Ahmed"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    বাংলা নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bengaliName}
                    onChange={(e) => setBengaliName(e.target.value)}
                    placeholder="তানভীর আহমেদ"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    ইমেইল <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="admin@hitunestudio.com"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">মোবাইল নম্বর</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    স্টুডিও ভূমিকা (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.entries(ROLE_LABELS_BN).map(([k, v]) => (
                      <option key={k} value={k}>{v.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">বিভাগ</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="MANAGEMENT">ম্যানেজমেন্ট</option>
                    <option value="AUDIO">অডিও বিভাগ</option>
                    <option value="VIDEO">ভিডিও বিভাগ</option>
                    <option value="QC">কোয়ালিটি কন্ট্রোল</option>
                    <option value="DELIVERY">ডেলিভারি বিভাগ</option>
                    <option value="ACCOUNTS">হিসাব বিভাগ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    পাসওয়ার্ড <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    পাসওয়ার্ড নিশ্চিত করুন <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 mt-2"
              >
                <span>{submitting ? 'নিবন্ধন করা হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">ইতিমধ্যে অ্যাকাউন্ট আছে? </span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-blue-400 hover:underline font-semibold"
                >
                  লগইন করুন
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center text-xs text-slate-500">
          HI TUNE STUDIO &copy; ২০২৬ | জামালপুর, বাংলাদেশ
        </div>
      </div>
    </div>
  )
}
