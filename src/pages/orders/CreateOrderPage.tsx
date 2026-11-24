import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Music2,
  Video,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Check,
} from 'lucide-react'
import { dataService } from '../../services/dataService'
import { OrderCategory, Profile } from '../../types/database'
import { useAuth } from '../../contexts/AuthContext'
import { formatBengaliNumber, formatCurrency } from '../../lib/utils'

type PrimaryOrderType = 'ELECTION' | 'ADMISSION' | 'WAZ' | 'CUSTOM'
type WorkFormat = 'AUDIO_ONLY' | 'AUDIO_VIDEO'

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [categories, setCategories] = useState<OrderCategory[]>([])
  const [staffList, setStaffList] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Wizard Step: 1 = Category, 2 = Format, 3 = Price, 4 = Details & Confirm
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // 1. Primary Order Type
  const [primaryType, setPrimaryType] = useState<PrimaryOrderType | null>(null)

  // 2. Work Format
  const [workFormat, setWorkFormat] = useState<WorkFormat>('AUDIO_ONLY')

  // 3. Pricing
  const [totalPrice, setTotalPrice] = useState<number | ''>('')
  const [advancePaid, setAdvancePaid] = useState<number | ''>('')

  // 4. Common Contact
  const [whatsappPhone, setWhatsappPhone] = useState('')

  // 5. Fields for Type 1: নির্বাচনী প্রচারণা গান
  const [songTitle, setSongTitle] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [candidatePosition, setCandidatePosition] = useState('')
  const [electionSymbol, setElectionSymbol] = useState('')
  const [electionArea, setElectionArea] = useState('')
  const [campaignSlogan, setCampaignSlogan] = useState('')

  // 6. Fields for Type 2: মাদ্রাসা / স্কুল ভর্তি মাইকিং
  const [institutionName, setInstitutionName] = useState('')
  const [admissionSession, setAdmissionSession] = useState('')
  const [availableClasses, setAvailableClasses] = useState('')
  const [institutionDetails, setInstitutionDetails] = useState('')

  // 7. Fields for Type 3: ওয়াজ মাহফিল মাইকিং
  const [mahfilTitle, setMahfilTitle] = useState('')
  const [mahfilLocation, setMahfilLocation] = useState('')
  const [mahfilSpeakers, setMahfilSpeakers] = useState('')
  const [mahfilSpecial, setMahfilSpecial] = useState('')

  // 8. Fields for Type 4: অন্যান্য কাস্টম কাজ
  const [customTitle, setCustomTitle] = useState('')
  const [customClientName, setCustomClientName] = useState('')
  const [customDetails, setCustomDetails] = useState('')

  // Staff Assignments
  const [assignedAudioId, setAssignedAudioId] = useState('')
  const [assignedVideoId, setAssignedVideoId] = useState('')

  useEffect(() => {
    async function loadMeta() {
      setLoading(true)
      try {
        const [cats, staff] = await Promise.all([
          dataService.getCategories(),
          dataService.getStaff(),
        ])
        setCategories(cats)
        setStaffList(staff)

        // Set default assignees
        const audioStaff = staff.find((s) => s.role === 'AUDIO_DESIGNER' || s.roles?.includes('AUDIO_DESIGNER'))
        const videoStaff = staff.find((s) => s.role === 'VIDEO_EDITOR' || s.roles?.includes('VIDEO_EDITOR'))
        if (audioStaff) setAssignedAudioId(audioStaff.id)
        if (videoStaff) setAssignedVideoId(videoStaff.id)
      } catch (err) {
        console.error('Failed to load metadata:', err)
      } finally {
        setLoading(false)
      }
    }
    loadMeta()
  }, [])

  // Auto-set work format when primary type changes and auto-advance to step 2
  const handleSelectPrimaryType = (type: PrimaryOrderType) => {
    setPrimaryType(type)
    setError('')
    if (type === 'WAZ') {
      setWorkFormat('AUDIO_ONLY')
    }
    // Smoothly transition to Step 2
    setTimeout(() => {
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 180)
  }

  // Work format select with smooth transition to step 3
  const handleSelectFormat = (fmt: WorkFormat) => {
    setWorkFormat(fmt)
    setError('')
    setTimeout(() => {
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 180)
  }

  // Step 3 to Step 4 validation
  const handleProceedToDetails = () => {
    if (!totalPrice || Number(totalPrice) <= 0) {
      setError('দয়া করে কাজের মোট চুক্তি মূল্য (প্রাইজ) লিখুন।')
      return
    }
    setError('')
    setStep(4)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Calculate Due Balance
  const numTotal = Number(totalPrice) || 0
  const numAdvance = Number(advancePaid) || 0
  const dueBalance = Math.max(0, numTotal - numAdvance)

  const isAudioRequired = true
  const isVideoRequired = workFormat === 'AUDIO_VIDEO'

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!primaryType) {
      setStep(1)
      setError('দয়া করে প্রথমে কাজের ক্যাটাগরি নির্বাচন করুন।')
      return
    }

    if (!totalPrice || Number(totalPrice) <= 0) {
      setStep(3)
      setError('দয়া করে কাজের চুক্তি মূল্য (প্রাইজ) লিখুন।')
      return
    }

    if (!whatsappPhone.trim()) {
      setError('দয়া করে ক্লায়েন্টের WhatsApp মোবাইল নম্বরটি লিখুন।')
      return
    }

    let finalTitle = ''
    let finalClientName = ''
    let finalCategorySlug = 'custom-order'
    let dynamicDetails: any = {}

    if (primaryType === 'ELECTION') {
      if (!candidateName.trim()) {
        setError('দয়া করে প্রার্থীর নাম লিখুন।')
        return
      }
      finalTitle = songTitle.trim() || `${candidateName.trim()} - নির্বাচনী প্রচারণা গান`
      finalClientName = candidateName.trim()
      finalCategorySlug = isVideoRequired ? 'election-video' : 'election-song'
      dynamicDetails.election_details = {
        candidate_name: candidateName.trim(),
        candidate_position: candidatePosition.trim(),
        election_area: electionArea.trim(),
        election_symbol: electionSymbol.trim(),
        campaign_message: campaignSlogan.trim(),
      }
    } else if (primaryType === 'ADMISSION') {
      if (!institutionName.trim()) {
        setError('দয়া করে মাদ্রাসা বা স্কুলের নাম লিখুন।')
        return
      }
      finalTitle = `${institutionName.trim()} - ভর্তি মাইকিং বিজ্ঞাপন`
      finalClientName = institutionName.trim()
      finalCategorySlug = 'school-admission'
      dynamicDetails.school_madrasa_details = {
        institution_name: institutionName.trim(),
        admission_session: admissionSession.trim(),
        available_classes: availableClasses.trim(),
        additional_instructions: institutionDetails.trim(),
      }
    } else if (primaryType === 'WAZ') {
      if (!mahfilTitle.trim()) {
        setError('দয়া করে মাহফিলের নাম বা বিষয় লিখুন।')
        return
      }
      finalTitle = `${mahfilTitle.trim()} - মাহফিল মাইকিং`
      finalClientName = mahfilTitle.trim()
      finalCategorySlug = 'waz-mahfil'
      dynamicDetails.waz_details = {
        event_name: mahfilTitle.trim(),
        event_location: mahfilLocation.trim(),
        speakers: mahfilSpeakers ? [mahfilSpeakers.trim()] : [],
        special_announcements: mahfilSpecial.trim(),
      }
    } else {
      if (!customTitle.trim()) {
        setError('দয়া করে কাজের শিরোনাম লিখুন।')
        return
      }
      finalTitle = customTitle.trim()
      finalClientName = customClientName.trim() || 'কাস্টম ক্লায়েন্ট'
      finalCategorySlug = 'custom-order'
    }

    // Find category ID
    const matchedCategory =
      categories.find((c) => c.slug === finalCategorySlug) ||
      categories[0]

    setSubmitting(true)
    try {
      const created = await dataService.createOrder({
        title: finalTitle,
        client_name: finalClientName,
        client_phone: whatsappPhone.trim(),
        client_address: electionArea || mahfilLocation || institutionDetails || '',
        category_id: matchedCategory?.id || undefined,
        category: matchedCategory,
        priority: 'NORMAL',
        deadline: null,
        audio_required: isAudioRequired,
        video_required: isVideoRequired,
        total_amount: numTotal,
        advance_amount: numAdvance,
        assigned_audio_staff_id: isAudioRequired ? assignedAudioId : null,
        assigned_video_staff_id: isVideoRequired ? assignedVideoId : null,
        description: campaignSlogan || institutionDetails || mahfilSpecial || customDetails || '',
        internal_instructions: `WhatsApp: ${whatsappPhone.trim()} | ফরম্যাট: ${workFormat === 'AUDIO_VIDEO' ? 'অডিও ও ভিডিও' : 'শুধু অডিও'}`,
        created_by: user?.id,
        dynamic_details: dynamicDetails,
      })

      navigate(`/orders/${created.id}`)
    } catch (err: any) {
      console.error('Failed to create order:', err)
      setError(err?.message || 'অর্ডার তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।')
    } finally {
      setSubmitting(false)
    }
  }

  const categoryLabel =
    primaryType === 'ELECTION'
      ? 'নির্বাচনী প্রচারণা'
      : primaryType === 'ADMISSION'
      ? 'মাদ্রাসা / স্কুল ভর্তি'
      : primaryType === 'WAZ'
      ? 'মাহফিল মাইকিং'
      : primaryType === 'CUSTOM'
      ? 'কাস্টম কাজ'
      : ''

  const stepsList = [
    { num: 1, label: 'ক্যাটাগরি' },
    { num: 2, label: 'মাধ্যম' },
    { num: 3, label: 'চুক্তি মূল্য' },
    { num: 4, label: 'তথ্যাদি ও কনফার্ম' },
  ]

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-xs">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>অর্ডার ফরম প্রস্তুত হচ্ছে...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>নতুন অর্ডার গ্রহণ</span>
            </h1>
          </div>
        </div>

        {/* Current Step Counter Badge */}
        <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-1.5">
          <span>ধাপ {formatBengaliNumber(step)} / ৪</span>
        </div>
      </div>

      {/* Modern Stepper Progress Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
        {/* Progress Bar Line */}
        <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-4 gap-1 text-center">
          {stepsList.map((s) => {
            const isDone = s.num < step
            const isCurrent = s.num === step
            const isClickable = s.num < step || (s.num === 2 && primaryType) || (s.num === 3 && primaryType)

            return (
              <button
                key={s.num}
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (s.num === 4 && (!totalPrice || Number(totalPrice) <= 0)) {
                    setError('দয়া করে চুক্তি মূল্য লিখুন।')
                    return
                  }
                  setError('')
                  setStep(s.num as any)
                }}
                className={`py-1.5 px-1 rounded-xl text-[10px] sm:text-xs font-semibold transition flex flex-col items-center justify-center gap-0.5 ${
                  isCurrent
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                    : isDone
                    ? 'text-emerald-400 hover:bg-slate-800/60 cursor-pointer'
                    : 'text-slate-500 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1">
                  {isDone ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold">
                      {formatBengaliNumber(s.num)}
                    </span>
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                <span className="sm:hidden text-[9px] font-medium leading-none">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* ধাপ ১: শুধু কাজের ক্যাটাগরি বাছাই */}
      {/* ========================================================= */}
      {step === 1 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold">
                ১
              </span>
              <span>কাজের ক্যাটাগরি</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* 1. Election */}
            <div
              onClick={() => handleSelectPrimaryType('ELECTION')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 active:scale-[0.98] ${
                primaryType === 'ELECTION'
                  ? 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-500/15 ring-2 ring-blue-500/40'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center text-xl shrink-0">
                  🗳️
                </div>
                <h3 className="font-bold text-sm text-white">নির্বাচনী প্রচারণা গান</h3>
              </div>
              {primaryType === 'ELECTION' && (
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            {/* 2. School / Madrasa */}
            <div
              onClick={() => handleSelectPrimaryType('ADMISSION')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 active:scale-[0.98] ${
                primaryType === 'ADMISSION'
                  ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/40'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xl shrink-0">
                  🎓
                </div>
                <h3 className="font-bold text-sm text-white">মাদ্রাসা / স্কুল ভর্তি</h3>
              </div>
              {primaryType === 'ADMISSION' && (
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            {/* 3. Waz Mahfil */}
            <div
              onClick={() => handleSelectPrimaryType('WAZ')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 active:scale-[0.98] ${
                primaryType === 'WAZ'
                  ? 'bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/40'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-xl shrink-0">
                  📢
                </div>
                <h3 className="font-bold text-sm text-white">ওয়াজ মাহফিল</h3>
              </div>
              {primaryType === 'WAZ' && (
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            {/* 4. Other / Custom */}
            <div
              onClick={() => handleSelectPrimaryType('CUSTOM')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 active:scale-[0.98] ${
                primaryType === 'CUSTOM'
                  ? 'bg-purple-950/60 border-purple-500 shadow-lg shadow-purple-500/15 ring-2 ring-purple-500/40'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-xl shrink-0">
                  ✨
                </div>
                <h3 className="font-bold text-sm text-white">অন্যান্য কাজ</h3>
              </div>
              {primaryType === 'CUSTOM' && (
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </div>

          {primaryType && (
            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setStep(2)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition transform active:scale-95 cursor-pointer"
              >
                <span>পরবর্তী ধাপ</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ধাপ ২: কাজের মাধ্যম সিলেক্ট (শুধু অডিও vs অডিও এবং ভিডিওসহ) */}
      {/* ========================================================= */}
      {step === 2 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold">
                ২
              </span>
              <span>কাজের মাধ্যম</span>
            </h2>
            <span className="text-xs font-semibold text-blue-400">{categoryLabel}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Option A: Audio Only */}
            <div
              onClick={() => handleSelectFormat('AUDIO_ONLY')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 active:scale-[0.98] ${
                workFormat === 'AUDIO_ONLY'
                  ? 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-500/15 ring-2 ring-blue-500/40'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Music2 className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-white">শুধু অডিও</h4>
              </div>
              {workFormat === 'AUDIO_ONLY' && (
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            {/* Option B: Audio & Video */}
            <div
              onClick={() => handleSelectFormat('AUDIO_VIDEO')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 active:scale-[0.98] ${
                workFormat === 'AUDIO_VIDEO'
                  ? 'bg-cyan-950/60 border-cyan-500 shadow-lg shadow-cyan-500/15 ring-2 ring-cyan-500/40'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                  <Video className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-white">অডিও এবং ভিডিওসহ</h4>
              </div>
              {workFormat === 'AUDIO_VIDEO' && (
                <div className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setError('')
                setStep(1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>পূর্ববর্তী ধাপ</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setError('')
                setStep(3)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition transform active:scale-95 cursor-pointer"
            >
              <span>পরবর্তী ধাপ</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ধাপ ৩: কাজের চুক্তি মূল্য / প্রাইস সিস্টেম */}
      {/* ========================================================= */}
      {step === 3 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-bold">
                ৩
              </span>
              <span>চুক্তি মূল্য ও অগ্রিম</span>
            </h2>
          </div>

          <div className="space-y-4">
            {/* Total Price Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                <span>মোট চুক্তি মূল্য (৳)</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                  ৳
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={totalPrice}
                  onChange={(e) => {
                    setError('')
                    setTotalPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }}
                  placeholder="যেমন: ৫০০০"
                  autoFocus
                  required
                  min={1}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-base sm:text-lg font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Advance Paid Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                অগ্রিম জমা (৳)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-base">
                  ৳
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="অগ্রিম থাকলে লিখুন"
                  min={0}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-base sm:text-lg font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Live Due Calculation Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">বকেয়া</span>
              <div className="text-right">
                <div className="text-lg sm:text-xl font-black text-amber-400">
                  {formatCurrency(dueBalance)}
                </div>
                {dueBalance === 0 && numTotal > 0 && (
                  <span className="text-[10px] text-emerald-400 font-semibold">পরিশোধিত</span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setError('')
                setStep(2)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>পূর্ববর্তী ধাপ</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToDetails}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition transform active:scale-95 cursor-pointer"
            >
              <span>পরবর্তী ধাপ</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ধাপ ৪: প্রয়োজনীয় তথ্যাদি ও অর্ডার কনফার্ম */}
      {/* ========================================================= */}
      {step === 4 && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 sm:p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold">
                  ৪
                </span>
                <span>প্রয়োজনীয় তথ্যাদি</span>
              </h2>
            </div>

            {/* 1. Client WhatsApp Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                WhatsApp / মোবাইল নম্বর <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="tel"
                  inputMode="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono transition"
                />
              </div>
            </div>

            {/* 2. Category-Specific Fields */}
            {/* TYPE 1: ELECTION */}
            {primaryType === 'ELECTION' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      প্রার্থীর নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="প্রার্থীর নাম"
                      required
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">পদের নাম</label>
                    <input
                      type="text"
                      value={candidatePosition}
                      onChange={(e) => setCandidatePosition(e.target.value)}
                      placeholder="মেয়র / চেয়ারম্যান / মেম্বার"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">প্রতীক / মার্কা</label>
                    <input
                      type="text"
                      value={electionSymbol}
                      onChange={(e) => setElectionSymbol(e.target.value)}
                      placeholder="প্রতীক"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">এলাকা / ওয়ার্ড</label>
                    <input
                      type="text"
                      value={electionArea}
                      onChange={(e) => setElectionArea(e.target.value)}
                      placeholder="এলাকার নাম"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block">গানের নাম</label>
                    <input
                      type="text"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      placeholder="গানের শিরোনাম"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">বিশেষ নোট</label>
                  <textarea
                    value={campaignSlogan}
                    onChange={(e) => setCampaignSlogan(e.target.value)}
                    rows={2}
                    placeholder="স্লোগান বা অতিরিক্ত তথ্য..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none transition"
                  />
                </div>
              </div>
            )}

            {/* TYPE 2: ADMISSION */}
            {primaryType === 'ADMISSION' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block">
                      প্রতিষ্ঠানের নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      placeholder="মাদ্রাসা বা স্কুলের নাম"
                      required
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">শিক্ষাবর্ষ</label>
                    <input
                      type="text"
                      value={admissionSession}
                      onChange={(e) => setAdmissionSession(e.target.value)}
                      placeholder="২০২৬ শিক্ষাবর্ষ"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">ভর্তির শ্রেণি</label>
                    <input
                      type="text"
                      value={availableClasses}
                      onChange={(e) => setAvailableClasses(e.target.value)}
                      placeholder="প্লে থেকে ১০ম শ্রেণি"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">ঠিকানা ও নোট</label>
                  <textarea
                    value={institutionDetails}
                    onChange={(e) => setInstitutionDetails(e.target.value)}
                    rows={2}
                    placeholder="ঠিকানা ও প্রয়োজনীয় তথ্য..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none transition"
                  />
                </div>
              </div>
            )}

            {/* TYPE 3: WAZ */}
            {primaryType === 'WAZ' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      মাহফিলের নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={mahfilTitle}
                      onChange={(e) => setMahfilTitle(e.target.value)}
                      placeholder="মাহফিলের নাম বা বিষয়"
                      required
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">স্থান ও সময়</label>
                    <input
                      type="text"
                      value={mahfilLocation}
                      onChange={(e) => setMahfilLocation(e.target.value)}
                      placeholder="মাহফিলের স্থান ও তারিখ"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">বক্তা ও নোট</label>
                    <textarea
                      value={mahfilSpeakers}
                      onChange={(e) => setMahfilSpeakers(e.target.value)}
                      rows={2}
                      placeholder="প্রধান বক্তা ও বিবরণ..."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TYPE 4: CUSTOM */}
            {primaryType === 'CUSTOM' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      কাজের শিরোনাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="কাজের নাম"
                      required
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">ক্লায়েন্টের নাম</label>
                    <input
                      type="text"
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      placeholder="ক্লায়েন্টের নাম"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">বিবরণ</label>
                  <textarea
                    value={customDetails}
                    onChange={(e) => setCustomDetails(e.target.value)}
                    rows={2}
                    placeholder="কাজের বিবরণ..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none transition"
                  />
                </div>
              </div>
            )}

            {/* Clean Symmetric Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                <span className="font-semibold text-white">{categoryLabel}</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/15 text-blue-400 font-semibold">
                  {workFormat === 'AUDIO_VIDEO' ? 'অডিও ও ভিডিও' : 'শুধু অডিও'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[11px] text-slate-400 block">মোট চুক্তি</span>
                  <strong className="text-sm text-white font-bold">{formatCurrency(numTotal)}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">অগ্রিম</span>
                  <strong className="text-sm text-emerald-400 font-bold">{formatCurrency(numAdvance)}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">বকেয়া</span>
                  <strong className="text-sm text-amber-400 font-bold">{formatCurrency(dueBalance)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation & Submit Buttons */}
          <div className="p-4 rounded-3xl bg-[#0b1120] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setError('')
                setStep(3)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>পূর্ববর্তী ধাপ</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/30 transition transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{submitting ? 'অর্ডার এন্ট্রি হচ্ছে...' : 'অর্ডার কনফার্ম করুন'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
