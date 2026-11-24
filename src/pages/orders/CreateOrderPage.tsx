import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Music2,
  Video,
  DollarSign,
  Vote,
  Mic,
  GraduationCap,
  Sparkles,
  Phone,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Calendar,
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

  // 4. Common Contact & Deadline
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [deadline, setDeadline] = useState('')

  // 5. Fields for Type 1: নির্বাচনী প্রচারণা গান
  const [songTitle, setSongTitle] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [candidatePosition, setCandidatePosition] = useState('মেয়র')
  const [electionSymbol, setElectionSymbol] = useState('')
  const [electionArea, setElectionArea] = useState('')
  const [campaignSlogan, setCampaignSlogan] = useState('')

  // 6. Fields for Type 2: মাদ্রাসা / স্কুল ভর্তি মাইকিং
  const [institutionName, setInstitutionName] = useState('')
  const [admissionSession, setAdmissionSession] = useState('২০২৬ শিক্ষাবর্ষ')
  const [availableClasses, setAvailableClasses] = useState('প্লে থেকে ১০ম শ্রেণি')
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
        deadline: deadline || null,
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
              <Sparkles className="h-4 w-4 text-blue-400" />
            </h1>
            <p className="text-[11px] text-slate-400">সহজ ৪ ধাপে দ্রুত অর্ডার এন্ট্রি করুন</p>
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
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold">
                  ১
                </span>
                <span>কাজের ক্যাটাগরি বাছাই করুন</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">যে কাজের অর্ডার নিতে চান সেটিতে ক্লিক করুন</p>
            </div>
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
                <div className="h-12 w-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center text-2xl shrink-0">
                  🗳️
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">নির্বাচনী প্রচারণা গান</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">মেয়র, চেয়ারম্যান ও মেম্বার নির্বাচন</p>
                </div>
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
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-2xl shrink-0">
                  🎓
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">মাদ্রাসা / স্কুল ভর্তি মাইকিং</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">নতুন শিক্ষাবর্ষের ভর্তি প্রচারণা</p>
                </div>
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
                <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-2xl shrink-0">
                  📢
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">ওয়াজ মাহফিল মাইকিং</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">তাফসিরুল কুরআন ও বার্ষিক মাহফিল</p>
                </div>
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
                <div className="h-12 w-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-2xl shrink-0">
                  ✨
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">অন্যান্য কাস্টম কাজ</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">গজল, নাশিদ বা সাধারণ বিজ্ঞাপন</p>
                </div>
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
                <span>পরবর্তী ধাপ (কাজের মাধ্যম)</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ধাপ ২: কাজের মাধ্যম সিলেক্ট (শুধু অডিও vs অডিও ও ভিডিও) */}
      {/* ========================================================= */}
      {step === 2 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold">
                  ২
                </span>
                <span>কাজের মাধ্যম নির্বাচন করুন</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                নির্বাচিত ক্যাটাগরি: <strong className="text-blue-400">{categoryLabel}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Option A: Audio Only */}
            <div
              onClick={() => handleSelectFormat('AUDIO_ONLY')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 active:scale-[0.98] ${
                workFormat === 'AUDIO_ONLY'
                  ? 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-500/15 ring-2 ring-blue-500/40'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Music2 className="h-6 w-6" />
                </div>
                {workFormat === 'AUDIO_ONLY' && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">শুধু অডিও (Audio Only)</h4>
                <p className="text-xs text-slate-400 mt-1">ভয়েস ওভার, সাউন্ড ডিজাইন ও অডিও প্রোডাকশন</p>
              </div>
            </div>

            {/* Option B: Audio & Video */}
            <div
              onClick={() => handleSelectFormat('AUDIO_VIDEO')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 active:scale-[0.98] ${
                workFormat === 'AUDIO_VIDEO'
                  ? 'bg-cyan-950/60 border-cyan-500 shadow-lg shadow-cyan-500/15 ring-2 ring-cyan-500/40'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                  <Video className="h-6 w-6" />
                </div>
                {workFormat === 'AUDIO_VIDEO' && (
                  <div className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">অডিও এবং ভিডিওসহ (Audio & Video)</h4>
                <p className="text-xs text-slate-400 mt-1">সাউন্ড প্রোডাকশন + পূর্ণাঙ্গ ভিডিও এডিটিং</p>
              </div>
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
              <span>পরবর্তী ধাপ (চুক্তি মূল্য)</span>
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
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-bold">
                  ৩
                </span>
                <span>কাজের চুক্তি মূল্য ও অগ্রিম জমা</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">মোট টাকার পরিমাণ এবং অগ্রিম জমার হিসাব লিখুন</p>
            </div>
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
                অগ্রিম পরিশোধ / জমা (৳) <span className="text-slate-500 text-[11px]">(যদি থাকে)</span>
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
                  placeholder="যেমন: ২০০০ (না থাকলে খালি রাখুন)"
                  min={0}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-base sm:text-lg font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Live Due Calculation Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">বর্তমান অবশিষ্ট বকেয়া</span>
                <span className="text-[11px] text-slate-500">চুক্তি মূল্য থেকে অগ্রিম বাদ দিয়ে</span>
              </div>
              <div className="text-right">
                <div className="text-lg sm:text-xl font-black text-amber-400">
                  {formatCurrency(dueBalance)}
                </div>
                {dueBalance === 0 && numTotal > 0 && (
                  <span className="text-[10px] text-emerald-400 font-semibold">সম্পূর্ণ পরিশোধিত</span>
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
              <span>পরবর্তী ধাপ (প্রয়োজনীয় তথ্য)</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ধাপ ৪: প্রয়োজনীয় তথ্যাদি ও অর্ডার কনফার্ম */}
      {/* ========================================================= */}
      {step === 4 && (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold">
                    ৪
                  </span>
                  <span>প্রয়োজনীয় তথ্যাদি লিখুন</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  ক্লায়েন্টের ফোন নম্বর ও কাজের বিবরণ দিন
                </p>
              </div>
            </div>

            {/* 1. Client WhatsApp Phone - Always prominent at top */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
              <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <span>ক্লায়েন্টের WhatsApp / মোবাইল নম্বর</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 font-mono"
              />
              <p className="text-[10px] text-slate-400">এই নম্বরে কাজের আপডেট ও ফাইল পাঠানো হবে</p>
            </div>

            {/* 2. Category-Specific Fields */}
            {/* TYPE 1: ELECTION */}
            {primaryType === 'ELECTION' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      প্রার্থীর নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="যেমন: হাজী রফিকুল ইসলাম"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">পদের নাম</label>
                    <input
                      type="text"
                      value={candidatePosition}
                      onChange={(e) => setCandidatePosition(e.target.value)}
                      placeholder="যেমন: মেয়র / চেয়ারম্যান / মেম্বার"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">নির্বাচনী প্রতীক / মার্কা</label>
                    <input
                      type="text"
                      value={electionSymbol}
                      onChange={(e) => setElectionSymbol(e.target.value)}
                      placeholder="যেমন: নৌকা / ধানের শীষ / হাতপাখা"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">নির্বাচনী এলাকা / ওয়ার্ড</label>
                    <input
                      type="text"
                      value={electionArea}
                      onChange={(e) => setElectionArea(e.target.value)}
                      placeholder="যেমন: জামালপুর সদর, ওয়ার্ড নং ০৩"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">গানের শিরোনাম (যদি নির্দিষ্ট থাকে)</label>
                    <input
                      type="text"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      placeholder="খালি রাখলে প্রার্থীর নামে স্বয়ংক্রিয় তৈরি হবে"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">স্লোগান বা বিশেষ নির্দেশনা (ঐচ্ছিক)</label>
                  <textarea
                    value={campaignSlogan}
                    onChange={(e) => setCampaignSlogan(e.target.value)}
                    rows={2}
                    placeholder="যেমন: উন্নয়নের ধারা অব্যাহত রাখতে সৎ ও যোগ্য প্রার্থীকে জয়যুক্ত করুন..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* TYPE 2: ADMISSION */}
            {primaryType === 'ADMISSION' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">
                      মাদ্রাসা বা স্কুলের নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      placeholder="যেমন: জামিয়া ইসলামিয়া দারুল উলুম মাদ্রাসা বা আইডিয়াল স্কুল"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">ভর্তি শিক্ষাবর্ষ ও বিভাগ</label>
                    <input
                      type="text"
                      value={admissionSession}
                      onChange={(e) => setAdmissionSession(e.target.value)}
                      placeholder="যেমন: ২০২৬ শিক্ষাবর্ষ, নূরানী ও হিফজ বিভাগ"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">ভর্তির শ্রেণি</label>
                    <input
                      type="text"
                      value={availableClasses}
                      onChange={(e) => setAvailableClasses(e.target.value)}
                      placeholder="যেমন: প্লে থেকে ১০ম শ্রেণি"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">প্রতিষ্ঠানের ঠিকানা ও বিশেষ আকর্ষণ</label>
                  <textarea
                    value={institutionDetails}
                    onChange={(e) => setInstitutionDetails(e.target.value)}
                    rows={2}
                    placeholder="যেমন: অভিজ্ঞ শিক্ষক, আবাসিক হোস্টেল, মনোরম পরিবেশ..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* TYPE 3: WAZ */}
            {primaryType === 'WAZ' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">
                      মাহফিলের নাম বা বিষয় <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={mahfilTitle}
                      onChange={(e) => setMahfilTitle(e.target.value)}
                      placeholder="যেমন: বাৎসরিক তাফসিরুল কুরআন ও দোয়া মাহফিল"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">মাহফিলের স্থান ও সময়</label>
                    <input
                      type="text"
                      value={mahfilLocation}
                      onChange={(e) => setMahfilLocation(e.target.value)}
                      placeholder="যেমন: জামালপুর বড় মসজিদ ময়দান, বাদে আসর"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">বক্তাগণ ও বিশেষ ঘোষণা</label>
                  <textarea
                    value={mahfilSpeakers}
                    onChange={(e) => setMahfilSpeakers(e.target.value)}
                    rows={2}
                    placeholder="যেমন: প্রধান বক্তা: হযরত মাওলানা..., বিশেষ বক্তা: ..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* TYPE 4: CUSTOM */}
            {primaryType === 'CUSTOM' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      কাজের শিরোনাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="যেমন: নতুন ব্যবসা প্রতিষ্ঠানের বিজ্ঞাপন"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">ক্লায়েন্টের নাম</label>
                    <input
                      type="text"
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      placeholder="ক্লায়েন্টের নাম লিখুন"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">কাজের বিস্তারিত বিবরণ</label>
                  <textarea
                    value={customDetails}
                    onChange={(e) => setCustomDetails(e.target.value)}
                    rows={2}
                    placeholder="কাজের বিস্তারিত বিবরণ ও বিশেষ নির্দেশনা..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Optional Deadline Input */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>ডেলিভারির সম্ভাব্য তারিখ (ঐচ্ছিক)</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Order Summary Recap Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 text-xs space-y-2">
              <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                অর্ডার সংক্ষেপ
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-400 text-[11px]">
                <div>
                  ক্যাটাগরি: <strong className="text-white block">{categoryLabel}</strong>
                </div>
                <div>
                  মাধ্যম: <strong className="text-white block">{workFormat === 'AUDIO_VIDEO' ? 'অডিও ও ভিডিও' : 'শুধু অডিও'}</strong>
                </div>
                <div>
                  মোট চুক্তি: <strong className="text-white block">{formatCurrency(numTotal)}</strong>
                </div>
                <div>
                  অগ্রিম: <strong className="text-emerald-400 block">{formatCurrency(numAdvance)}</strong>
                </div>
                <div>
                  বকেয়া: <strong className="text-amber-400 block">{formatCurrency(dueBalance)}</strong>
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
              <span>পূর্ববর্তী ধাপ (চুক্তি মূল্য)</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/30 transition transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{submitting ? 'অর্ডার এন্ট্রি হচ্ছে...' : '✅ অর্ডার কনফার্ম ও এন্ট্রি করুন'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
