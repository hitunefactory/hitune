import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderPlus,
  ArrowLeft,
  Save,
  Music,
  Video,
  DollarSign,
  User,
  Vote,
  Mic,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { dataService } from '../../services/dataService'
import { OrderCategory, Profile, OrderPriority } from '../../types/database'
import { useAuth } from '../../contexts/AuthContext'
import { formatBengaliNumber, formatCurrency } from '../../lib/utils'

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [categories, setCategories] = useState<OrderCategory[]>([])
  const [staffList, setStaffList] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // General Form State
  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<OrderPriority>('NORMAL')
  const [deadline, setDeadline] = useState('')
  const [audioRequired, setAudioRequired] = useState(true)
  const [videoRequired, setVideoRequired] = useState(false)
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [advanceAmount, setAdvanceAmount] = useState<number>(0)
  const [assignedAudioStaffId, setAssignedAudioStaffId] = useState('')
  const [assignedVideoStaffId, setAssignedVideoStaffId] = useState('')
  const [description, setDescription] = useState('')
  const [internalInstructions, setInternalInstructions] = useState('')

  // Dynamic Category States
  // 1. Election
  const [candidateName, setCandidateName] = useState('')
  const [candidatePosition, setCandidatePosition] = useState('')
  const [electionArea, setElectionArea] = useState('')
  const [unionOrWard, setUnionOrWard] = useState('')
  const [electionSymbol, setElectionSymbol] = useState('')
  const [campaignMessage, setCampaignMessage] = useState('')
  const [songStyle, setSongStyle] = useState('বাউল ও আধুনিক ফিউশন')
  const [electionSpecial, setElectionSpecial] = useState('')

  // 2. Waz
  const [wazEventName, setWazEventName] = useState('')
  const [wazInstitution, setWazInstitution] = useState('')
  const [wazLocation, setWazLocation] = useState('')
  const [wazDateTime, setWazDateTime] = useState('')
  const [wazSpeakers, setWazSpeakers] = useState('')
  const [wazChiefGuest, setWazChiefGuest] = useState('')
  const [wazPresident, setWazPresident] = useState('')
  const [wazSpecial, setWazSpecial] = useState('')

  // 3. School / Madrasa
  const [instName, setInstName] = useState('')
  const [instAddress, setInstAddress] = useState('')
  const [admissionSession, setAdmissionSession] = useState('২০২৬ শিক্ষাবর্ষ')
  const [availableClasses, setAvailableClasses] = useState('প্লে থেকে দশম শ্রেণি')
  const [facilities, setFacilities] = useState('')
  const [contactNumbers, setContactNumbers] = useState('')
  const [schoolSpecial, setSchoolSpecial] = useState('')

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

        if (cats.length > 0) {
          setCategoryId(cats[0].id)
        }

        // Set default assignees
        const audioStaff = staff.find((s) => s.role === 'AUDIO_DESIGNER')
        const videoStaff = staff.find((s) => s.role === 'VIDEO_EDITOR')
        if (audioStaff) setAssignedAudioStaffId(audioStaff.id)
        if (videoStaff) setAssignedVideoStaffId(videoStaff.id)
      } catch (err) {
        console.error('Failed to load metadata:', err)
      } finally {
        setLoading(false)
      }
    }
    loadMeta()
  }, [])

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const dynamicType = selectedCategory?.dynamic_form_type || 'GENERAL'

  // Auto-check video required for video categories
  useEffect(() => {
    if (selectedCategory?.slug?.includes('video') || selectedCategory?.slug === 'full-production') {
      setVideoRequired(true)
    }
  }, [categoryId, selectedCategory])

  const dueAmount = Math.max(0, (Number(totalAmount) || 0) - (Number(advanceAmount) || 0))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !clientName.trim() || !clientPhone.trim()) {
      alert('দয়া করে কাজের শিরোনাম, ক্লায়েন্টের নাম এবং মোবাইল নম্বর পূরণ করুন।')
      return
    }

    setSubmitting(true)
    try {
      // Build dynamic category details
      let dynamicDetails: any = {}
      if (dynamicType === 'ELECTION') {
        dynamicDetails.election_details = {
          candidate_name: candidateName,
          candidate_position: candidatePosition,
          election_area: electionArea,
          union_or_ward: unionOrWard,
          election_symbol: electionSymbol,
          campaign_message: campaignMessage,
          song_style: songStyle,
          special_instructions: electionSpecial,
        }
      } else if (dynamicType === 'WAZ') {
        dynamicDetails.waz_details = {
          event_name: wazEventName,
          institution_name: wazInstitution,
          event_location: wazLocation,
          event_date_time: wazDateTime,
          speakers: wazSpeakers.split(',').map((s) => s.trim()).filter(Boolean),
          chief_guest: wazChiefGuest,
          president: wazPresident,
          special_announcements: wazSpecial,
        }
      } else if (dynamicType === 'ADMISSION') {
        dynamicDetails.school_madrasa_details = {
          institution_name: instName,
          address: instAddress,
          admission_session: admissionSession,
          available_classes: availableClasses,
          facilities: facilities.split(',').map((s) => s.trim()).filter(Boolean),
          contact_numbers: contactNumbers,
          additional_instructions: schoolSpecial,
        }
      }

      const created = await dataService.createOrder({
        title,
        client_name: clientName,
        client_phone: clientPhone,
        client_address: clientAddress,
        category_id: categoryId,
        priority,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        audio_required: audioRequired,
        video_required: videoRequired,
        total_amount: Number(totalAmount) || 0,
        advance_amount: Number(advanceAmount) || 0,
        assigned_audio_staff_id: audioRequired ? assignedAudioStaffId : null,
        assigned_video_staff_id: videoRequired ? assignedVideoStaffId : null,
        description,
        internal_instructions: internalInstructions,
        created_by: user?.id,
        dynamic_details: dynamicDetails,
      })

      navigate(`/orders/${created.id}`)
    } catch (err) {
      console.error('Failed to create order:', err)
      alert('অর্ডার তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।')
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-blue-500" />
              <span>নতুন স্টুডিও অর্ডার ফর্ম</span>
            </h1>
            <p className="text-xs text-slate-400">
              ক্যাটাগরি অনুযায়ী ডাইনামিক ফিল্ড পূরণ করে নতুন প্রোডাকশন অর্ডার এন্ট্রি করুন
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Client & Basic Info */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-2">
            <User className="h-4 w-4 text-blue-400" />
            <span>১. ক্লায়েন্ট ও সাধারণ তথ্য</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                কাজের শিরোনাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: জামালপুর পৌরসভা মেয়র নির্বাচন - নির্বাচনী থিম সং"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                ক্লায়েন্টের নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="হাজী রফিকুল ইসলাম"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                মোবাইল নম্বর <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">ক্লায়েন্টের ঠিকানা</label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="বড় বাজার, জামালপুর সদর"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                অর্ডার ক্যাটাগরি <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_bn}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">অগ্রাধিকার (Priority)</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as OrderPriority)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="LOW">সাধারণ (Low)</option>
                <option value="NORMAL">স্বাভাবিক (Normal)</option>
                <option value="HIGH">জরুরি (High)</option>
                <option value="URGENT">অতি জরুরি (Urgent)</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">ডেলিভারি ডেডলাইন</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: DYNAMIC CATEGORY FORMS (PART 7 Requirement) */}
        {dynamicType === 'ELECTION' && (
          <div className="p-6 rounded-3xl bg-blue-950/20 border border-blue-500/30 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-400 border-b border-blue-500/20 pb-2">
              <Vote className="h-4 w-4" />
              <span>২. নির্বাচনী প্রচারণা গান ও ভিডিওর বিশেষ তথ্য</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">প্রার্থীর নাম</label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="যেমন: হাজী রফিকুল ইসলাম"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">প্রার্থীর পদবী</label>
                <input
                  type="text"
                  value={candidatePosition}
                  onChange={(e) => setCandidatePosition(e.target.value)}
                  placeholder="মেয়র পদপ্রার্থী / ইউপি চেয়ারম্যান"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">নির্বাচনী এলাকা</label>
                <input
                  type="text"
                  value={electionArea}
                  onChange={(e) => setElectionArea(e.target.value)}
                  placeholder="জামালপুর পৌরসভা / মেলান্দহ"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">ইউনিয়ন বা ওয়ার্ড</label>
                <input
                  type="text"
                  value={unionOrWard}
                  onChange={(e) => setUnionOrWard(e.target.value)}
                  placeholder="সকল ওয়ার্ড / ৫নং ওয়ার্ড"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">নির্বাচনী প্রতীক</label>
                <input
                  type="text"
                  value={electionSymbol}
                  onChange={(e) => setElectionSymbol(e.target.value)}
                  placeholder="নৌকা / ধানের শীষ / হাতপাখা / স্বতন্ত্র"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">গানের সুরের ধরন (Style)</label>
                <input
                  type="text"
                  value={songStyle}
                  onChange={(e) => setSongStyle(e.target.value)}
                  placeholder="বাউল, ফোক, আধুনিক রিদম, ব্যান্ড"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">প্রচারণার মূল স্লোগান বা বক্তব্য</label>
                <textarea
                  value={campaignMessage}
                  onChange={(e) => setCampaignMessage(e.target.value)}
                  rows={2}
                  placeholder="উন্নয়ন ও সততার প্রতীক, জামালপুরের গর্বিত সন্তান..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">বিশেষ নির্দেশনা (ভিডিও ও অডিও)</label>
                <input
                  type="text"
                  value={electionSpecial}
                  onChange={(e) => setElectionSpecial(e.target.value)}
                  placeholder="ভিডিওতে ড্রোন শট ও জনসভার ফুটেজ সহ এডিট করতে হবে"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {dynamicType === 'WAZ' && (
          <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 border-b border-emerald-500/20 pb-2">
              <Mic className="h-4 w-4" />
              <span>২. ওয়াজ মাহফিল মাইকিং বিজ্ঞাপনের বিশেষ তথ্য</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">মাহফিলের নাম</label>
                <input
                  type="text"
                  value={wazEventName}
                  onChange={(e) => setWazEventName(e.target.value)}
                  placeholder="১৫তম বাৎসরিক তাফসিরুল কুরআন মাহফিল"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">আয়োজক প্রতিষ্ঠান / মসজিদ</label>
                <input
                  type="text"
                  value={wazInstitution}
                  onChange={(e) => setWazInstitution(e.target.value)}
                  placeholder="মেলান্দহ কেন্দ্রীয় জামে মসজিদ"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">স্থান</label>
                <input
                  type="text"
                  value={wazLocation}
                  onChange={(e) => setWazLocation(e.target.value)}
                  placeholder="মেলান্দহ বাজার ময়দান, জামালপুর"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">তারিখ ও সময়</label>
                <input
                  type="text"
                  value={wazDateTime}
                  onChange={(e) => setWazDateTime(e.target.value)}
                  placeholder="৩০ নভেম্বর ও ১-২ ডিসেম্বর, বাদ আছর"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">বক্তাগণের নাম (কমা দিয়ে লিখুন)</label>
                <input
                  type="text"
                  value={wazSpeakers}
                  onChange={(e) => setWazSpeakers(e.target.value)}
                  placeholder="মাওলানা তারেক মনোয়ার, মুফতি হাবিবুর রহমান মিসবাহ"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">প্রধান অতিথি</label>
                <input
                  type="text"
                  value={wazChiefGuest}
                  onChange={(e) => setWazChiefGuest(e.target.value)}
                  placeholder="স্থানীয় সংসদ সদস্য / বিশিষ্ট সমাজসেবক"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">সভাপতি</label>
                <input
                  type="text"
                  value={wazPresident}
                  onChange={(e) => setWazPresident(e.target.value)}
                  placeholder="হযরত মাওলানা আবুল কাশেম"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">বিশেষ ঘোষণা</label>
                <input
                  type="text"
                  value={wazSpecial}
                  onChange={(e) => setWazSpecial(e.target.value)}
                  placeholder="মহিলাদের পর্দার সহিত ওয়াজ শুনার সুব্যবস্থা রহিয়াছে।"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {dynamicType === 'ADMISSION' && (
          <div className="p-6 rounded-3xl bg-amber-950/20 border border-amber-500/30 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-400 border-b border-amber-500/20 pb-2">
              <GraduationCap className="h-4 w-4" />
              <span>২. স্কুল ও মাদ্রাসা ভর্তি বিজ্ঞাপনের বিশেষ তথ্য</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">প্রতিষ্ঠানের নাম</label>
                <input
                  type="text"
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  placeholder="আল-হেরা ক্যাডেট একাডেমি"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">ঠিকানা</label>
                <input
                  type="text"
                  value={instAddress}
                  onChange={(e) => setInstAddress(e.target.value)}
                  placeholder="কলেজ রোড, নয়াপাড়া, জামালপুর"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">ভর্তি সেশন</label>
                <input
                  type="text"
                  value={admissionSession}
                  onChange={(e) => setAdmissionSession(e.target.value)}
                  placeholder="২০২৬ শিক্ষাবর্ষ"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">ভর্তিযোগ্য শ্রেণি</label>
                <input
                  type="text"
                  value={availableClasses}
                  onChange={(e) => setAvailableClasses(e.target.value)}
                  placeholder="প্লে গ্রুপ থেকে দশম শ্রেণি"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">সুযোগ-সুবিধাসমূহ (কমা দিয়ে লিখুন)</label>
                <input
                  type="text"
                  value={facilities}
                  onChange={(e) => setFacilities(e.target.value)}
                  placeholder="শীতাতপ নিয়ন্ত্রিত শ্রেণিকক্ষ, কম্পিউটার ল্যাব, অভিজ্ঞ শিক্ষক"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">যোগাযোগ নম্বর</label>
                <input
                  type="text"
                  value={contactNumbers}
                  onChange={(e) => setContactNumbers(e.target.value)}
                  placeholder="017xxxxxxxx, 018xxxxxxxx"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">অতিরিক্ত সুবিধা ও ছাড়</label>
                <input
                  type="text"
                  value={schoolSpecial}
                  onChange={(e) => setSchoolSpecial(e.target.value)}
                  placeholder="প্রথম ৫০ জনের জন্য বিশেষ ভর্তি ছাড়"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Production Routing & Assignment */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-2">
            <Music className="h-4 w-4 text-cyan-400" />
            <span>৩. প্রোডাকশন বিভাগ ও টিম অ্যাসাইনমেন্ট</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">অডিও প্রোডাকশন প্রয়োজন?</div>
                <div className="text-[11px] text-slate-400">ভয়েস ওভার, রেকর্ডিং ও মিক্সিং</div>
              </div>
              <input
                type="checkbox"
                checked={audioRequired}
                onChange={(e) => setAudioRequired(e.target.checked)}
                className="h-5 w-5 rounded text-blue-600 bg-slate-900 border-slate-700"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">ভিডিও প্রোডাকশন প্রয়োজন?</div>
                <div className="text-[11px] text-slate-400">ভিডিও এডিটিং, ভিজ্যুয়াল ও গ্রাফিক্স</div>
              </div>
              <input
                type="checkbox"
                checked={videoRequired}
                onChange={(e) => setVideoRequired(e.target.checked)}
                className="h-5 w-5 rounded text-cyan-600 bg-slate-900 border-slate-700"
              />
            </div>

            {audioRequired && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">অ্যাসাইনকৃত অডিও ডিজাইনার</label>
                <select
                  value={assignedAudioStaffId}
                  onChange={(e) => setAssignedAudioStaffId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  <option value="">নির্ধারণ করুন</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.bengali_name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {videoRequired && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">অ্যাসাইনকৃত ভিডিও এডিটর</label>
                <select
                  value={assignedVideoStaffId}
                  onChange={(e) => setAssignedVideoStaffId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  <option value="">নির্ধারণ করুন</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.bengali_name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Financials & Pricing */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span>৪. বিলিং ও অগ্রিম পেমেন্ট</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">মোট নির্ধারিত মূল্য (৳)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                min="0"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">গৃহীত অগ্রিম টাকা (৳)</label>
              <input
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                min="0"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">অবশিষ্ট বকেয়া (৳)</label>
              <div className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-amber-400 flex items-center">
                {formatCurrency(dueAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: General Description & Internal Notes */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">কাজের বিস্তারিত বর্ণনা</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="ক্লায়েন্টের চাহিদা ও স্ক্রিপ্ট সম্পর্কিত সাধারণ বর্ণনা..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">স্টুডিও ইন্টারনাল নির্দেশনা</label>
              <textarea
                value={internalInstructions}
                onChange={(e) => setInternalInstructions(e.target.value)}
                rows={3}
                placeholder="প্রোডাকশন টিমের জন্য অভ্যন্তরীণ টেকনিক্যাল নির্দেশনা..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition"
          >
            বাতিল
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition transform active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>{submitting ? 'অর্ডার তৈরি হচ্ছে...' : 'অর্ডার সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
