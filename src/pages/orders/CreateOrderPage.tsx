import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FolderPlus,
  ArrowLeft,
  CheckCircle2,
  Music2,
  Video,
  DollarSign,
  User,
  Vote,
  Mic,
  GraduationCap,
  Sparkles,
  Phone,
  Calendar,
  MessageCircle,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { dataService } from '../../services/dataService'
import { OrderCategory, Profile, OrderPriority } from '../../types/database'
import { useAuth } from '../../contexts/AuthContext'
import { formatBengaliNumber, formatCurrency, getLocalDateString } from '../../lib/utils'

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

  // 1. Primary Order Type (নির্বাচনী প্রচারণা গান, মাদ্রাসা/স্কুল ভর্তি, ওয়াজ মাহফিল, অন্যান্য)
  const [primaryType, setPrimaryType] = useState<PrimaryOrderType | null>(null)

  // 2. Work Format (শুধু অডিও vs অডিও এবং ভিডিওসহ)
  const [workFormat, setWorkFormat] = useState<WorkFormat>('AUDIO_ONLY')

  // 3. Pricing
  const [totalPrice, setTotalPrice] = useState<number | ''>('')
  const [advancePaid, setAdvancePaid] = useState<number | ''>('')

  // 4. Common Contact & Delivery
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return getLocalDateString(d)
  })
  const [priority, setPriority] = useState<OrderPriority>('NORMAL')

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

  // Auto-set work format when primary type changes
  const handleSelectPrimaryType = (type: PrimaryOrderType) => {
    setPrimaryType(type)
    setError('')
    if (type === 'WAZ') {
      setWorkFormat('AUDIO_ONLY')
    }
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
      setError('দয়া করে প্রথমে কাজের ক্যাটাগরি নির্বাচন করুন।')
      return
    }

    if (!totalPrice || Number(totalPrice) <= 0) {
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
        priority,
        deadline: deliveryDate ? new Date(deliveryDate).toISOString() : null,
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

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-xs">
        ফরম লোড হচ্ছে...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>নতুন অর্ডার গ্রহণ</span>
              <Sparkles className="h-4 w-4 text-blue-400" />
            </h1>
            <p className="text-xs text-slate-400">কাজের ধরন অনুযায়ী সহজ ধাপে অর্ডার ডাটা এন্ট্রি করুন</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 shadow-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ========================================================= */}
        {/* ধাপ ১: মূল কাজের টাইপ নির্বাচন (3 Main Categories) */}
        {/* ========================================================= */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
              ১
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">কাজের ক্যাটাগরি পছন্দ করুন</h2>
              <p className="text-[11px] text-slate-400">কোন ধরনের কাজের অর্ডার নিতে চান?</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* 1. Election */}
            <div
              onClick={() => handleSelectPrimaryType('ELECTION')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 ${
                primaryType === 'ELECTION'
                  ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl">
                  🗳️
                </div>
                {primaryType === 'ELECTION' && (
                  <CheckCircle2 className="h-5 w-5 text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">নির্বাচনী প্রচারণা গান</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">পৌরসভা, ইউনিয়ন ও জাতীয় নির্বাচন</p>
              </div>
            </div>

            {/* 2. School / Madrasa */}
            <div
              onClick={() => handleSelectPrimaryType('ADMISSION')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 ${
                primaryType === 'ADMISSION'
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl">
                  🎓
                </div>
                {primaryType === 'ADMISSION' && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">মাদ্রাসা / স্কুল ভর্তি মাইকিং</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">নতুন শিক্ষাবর্ষের ভর্তি প্রচার বিজ্ঞাপন</p>
              </div>
            </div>

            {/* 3. Waz Mahfil */}
            <div
              onClick={() => handleSelectPrimaryType('WAZ')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 ${
                primaryType === 'WAZ'
                  ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl">
                  📢
                </div>
                {primaryType === 'WAZ' && (
                  <CheckCircle2 className="h-5 w-5 text-amber-400" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">মাহফিল মাইকিং</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">তাফসিরুল কুরআন ও ওয়াজ মাহফিল</p>
              </div>
            </div>
          </div>

          {/* Optional small custom order button */}
          <div className="pt-1 flex items-center justify-end">
            <button
              type="button"
              onClick={() => handleSelectPrimaryType('CUSTOM')}
              className={`text-[11px] font-semibold transition px-3 py-1.5 rounded-xl border ${
                primaryType === 'CUSTOM'
                  ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              + অন্যান্য কাস্টম অর্ডার (গজল / বিজ্ঞাপন)
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ধাপ ২: কাজের মাধ্যম (শুধু অডিও নাকি অডিও ও ভিডিও) */}
        {/* ========================================================= */}
        {primaryType && primaryType !== 'WAZ' && (
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                ২
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">কাজের মাধ্যম নির্বাচন করুন</h2>
                <p className="text-[11px] text-slate-400">শুধু অডিও রেকর্ড হবে নাকি ভিডিওসহ তৈরি হবে?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option A: Audio Only */}
              <div
                onClick={() => setWorkFormat('AUDIO_ONLY')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  workFormat === 'AUDIO_ONLY'
                    ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Music2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">শুধু অডিও (Audio Only)</h4>
                    <p className="text-[11px] text-slate-400">ভয়েস ওভার, সাউন্ড ও মিউজিক ট্র্যাক</p>
                  </div>
                </div>
                {workFormat === 'AUDIO_ONLY' && (
                  <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
                )}
              </div>

              {/* Option B: Audio & Video */}
              <div
                onClick={() => setWorkFormat('AUDIO_VIDEO')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  workFormat === 'AUDIO_VIDEO'
                    ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">অডিও এবং ভিডিওসহ (Audio & Video)</h4>
                    <p className="text-[11px] text-slate-400">অডিও প্রোডাকশন + ফুল ভিডিও এডিটিং</p>
                  </div>
                </div>
                {workFormat === 'AUDIO_VIDEO' && (
                  <CheckCircle2 className="h-5 w-5 text-purple-400 shrink-0" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ধাপ ৩: প্রাইজ ও পেমেন্ট (Price & Payment) */}
        {/* ========================================================= */}
        {primaryType && (
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                {primaryType === 'WAZ' ? '২' : '৩'}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">কাজের চুক্তি মূল্য (প্রাইজ)</h2>
                <p className="text-[11px] text-slate-400">মোট টাকা ও অগ্রিম জমার পরিমাণ লিখুন</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  মোট চুক্তি মূল্য (৳) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="যেমন: 5000"
                    required
                    min={1}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  অগ্রিম পরিশোধ (৳)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  <input
                    type="number"
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="যেমন: 2000"
                    min={0}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">বর্তমান বকেয়া</label>
                <div className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-amber-400 flex items-center justify-between">
                  <span>বকেয়া:</span>
                  <span>{formatCurrency(dueBalance)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ধাপ ৪: প্রয়োজনীয় তথ্যসমূহ (Details per chosen category) */}
        {/* ========================================================= */}
        {primaryType && (
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                {primaryType === 'WAZ' ? '৩' : '৪'}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">প্রয়োজনীয় তথ্যাদি</h2>
                <p className="text-[11px] text-slate-400">WhatsApp নম্বর ও অর্ডার সংশ্লিষ্ট বিবরণ</p>
              </div>
            </div>

            {/* A. TYPE 1: ELECTION DETAILS */}
            {primaryType === 'ELECTION' && (
              <div className="space-y-3.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      গানের নাম / শিরোনাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      placeholder="যেমন: জামালপুর মেয়র নির্বাচন প্রচারণা গান"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

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
                    <label className="text-xs font-semibold text-slate-300">প্রার্থীর পদবী</label>
                    <input
                      type="text"
                      value={candidatePosition}
                      onChange={(e) => setCandidatePosition(e.target.value)}
                      placeholder="যেমন: মেয়র / চেয়ারম্যান / মেম্বার / কাউন্সিলর"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">নির্বাচনী প্রতীক</label>
                    <input
                      type="text"
                      value={electionSymbol}
                      onChange={(e) => setElectionSymbol(e.target.value)}
                      placeholder="যেমন: নৌকা, ধানের শীষ, হাতপাখা, ট্রাক"
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

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      অর্ডারকৃত WhatsApp মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-400" />
                      <input
                        type="tel"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        placeholder="017xxxxxxxx (WhatsApp)"
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">প্রচারণার স্লোগান / বিশেষ নির্দেশনা</label>
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

            {/* B. TYPE 2: ADMISSION DETAILS */}
            {primaryType === 'ADMISSION' && (
              <div className="space-y-3.5 pt-1">
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
                    <label className="text-xs font-semibold text-slate-300">
                      অর্ডারকৃত WhatsApp মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-400" />
                      <input
                        type="tel"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        placeholder="017xxxxxxxx (WhatsApp)"
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
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
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    প্রতিষ্ঠানের ঠিকানা ও মাইকিংয়ের প্রয়োজনীয় তথ্যসমূহ
                  </label>
                  <textarea
                    value={institutionDetails}
                    onChange={(e) => setInstitutionDetails(e.target.value)}
                    rows={3}
                    placeholder="যেমন: জামালপুর সদর রোড। বৈশিষ্ট্য: অভিজ্ঞ শিক্ষক, আবাসিক হোস্টেল, বিশুদ্ধ পরিবেশ..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* C. TYPE 3: WAZ MAHFIL DETAILS */}
            {primaryType === 'WAZ' && (
              <div className="space-y-3.5 pt-1">
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

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      অর্ডারকৃত WhatsApp মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-400" />
                      <input
                        type="tel"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        placeholder="017xxxxxxxx (WhatsApp)"
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
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

            {/* D. TYPE 4: CUSTOM ORDER DETAILS */}
            {primaryType === 'CUSTOM' && (
              <div className="space-y-3.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      কাজের শিরোনাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="যেমন: ইসলামিক নাশিদ বা ব্যবসা প্রতিষ্ঠানের ভয়েস"
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

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300">
                      অর্ডারকৃত WhatsApp মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-400" />
                      <input
                        type="tel"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        placeholder="017xxxxxxxx (WhatsApp)"
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">বিস্তারিত বিবরণ</label>
                  <textarea
                    value={customDetails}
                    onChange={(e) => setCustomDetails(e.target.value)}
                    rows={3}
                    placeholder="কাজের বিস্তারিত বিবরণ ও বিশেষ নির্দেশনা..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Delivery Date (Common) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-800/80">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">ডেলিভারির সম্ভাব্য তারিখ</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">কাজের অগ্রাধিকার</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as OrderPriority)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="NORMAL">সাধারণ (Normal)</option>
                  <option value="HIGH">জরুরি (High)</option>
                  <option value="URGENT">অতি জরুরি (Urgent)</option>
                  <option value="LOW">স্বাভাবিক (Low)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* সাবমিট বাটন (Submit Order) */}
        {/* ========================================================= */}
        {primaryType && (
          <div className="p-4 rounded-3xl bg-[#0b1120] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            <div className="text-xs text-slate-400">
              মোট চুক্তি: <strong className="text-white">{formatCurrency(numTotal)}</strong> | 
              অগ্রিম: <strong className="text-emerald-400">{formatCurrency(numAdvance)}</strong> | 
              বকেয়া: <strong className="text-amber-400">{formatCurrency(dueBalance)}</strong>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 transition transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'অর্ডার এন্ট্রি হচ্ছে...' : 'অর্ডার কনফার্ম ও এন্ট্রি করুন'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
