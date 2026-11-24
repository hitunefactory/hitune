import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Headphones,
  Video,
  CheckCircle,
  Truck,
  MessageSquare,
  FileText,
  DollarSign,
  AlertCircle,
  Download,
  ExternalLink,
  Send,
  Plus,
  RefreshCw,
  Layers,
  Sparkles,
  Receipt,
  Edit3,
  Printer,
  Play,
  Trash2,
} from 'lucide-react'
import { dataService } from '../../services/dataService'
import { Order, TaskSubmission, Revision, OrderComment, Profile, PaymentMethod } from '../../types/database'
import { StatusBadge, PaymentBadge } from '../../components/ui/StatusBadge'
import { useAuth } from '../../contexts/AuthContext'
import { formatBengaliNumber, formatBengaliDate, formatCurrency } from '../../lib/utils'
import { STATUS_MAP_BN, PAYMENT_METHOD_MAP_BN } from '../../lib/constants'
import { InvoiceModal } from '../../components/orders/InvoiceModal'
import { EditOrderModal } from '../../components/orders/EditOrderModal'

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([])
  const [comments, setComments] = useState<OrderComment[]>([])
  const [staffList, setStaffList] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  // Comments
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  // Record Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [trxRef, setTrxRef] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  // Delivery Modal
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<'ONLINE' | 'PENDRIVE' | 'WHATSAPP' | 'EMAIL' | 'OTHER'>('WHATSAPP')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  // Invoice, Edit & Delete Order Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteOrder = async () => {
    if (!order) return
    setDeleting(true)
    try {
      await dataService.deleteOrder(order.id)
      navigate('/orders')
    } catch (err) {
      console.error('Delete order failed:', err)
      alert('অর্ডার মুছে ফেলতে সমস্যা হয়েছে')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // Tabs
  const [activeTab, setActiveTab] = useState<'details' | 'submissions' | 'comments' | 'payments'>('details')

  const loadOrder = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [ord, staff] = await Promise.all([
        dataService.getOrderById(id),
        dataService.getStaff(),
      ])
      if (ord) {
        setOrder(ord)
        setSubmissions(ord.submissions || (await dataService.getSubmissions(ord.id)))
        setComments(ord.comments || (await dataService.getComments(ord.id)))
        setRecipientName(ord.client_name)
        setRecipientPhone(ord.client_phone)
        setPaymentAmount(ord.due_amount)
      }
      setStaffList(staff)
    } catch (err) {
      console.error('Failed to load order:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [id])

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order || !user || !newComment.trim()) return

    setSendingComment(true)
    try {
      await dataService.addComment(order.id, user.id, newComment.trim())
      setNewComment('')
      const updatedComments = await dataService.getComments(order.id)
      setComments(updatedComments)
    } catch (err) {
      console.error('Failed to post comment:', err)
    } finally {
      setSendingComment(false)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order || !paymentAmount || paymentAmount <= 0) return

    try {
      await dataService.recordPayment({
        order_id: order.id,
        order_number: order.order_number,
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        transaction_reference: trxRef,
        notes: paymentNotes,
        recorded_by: user?.id,
      })
      setShowPaymentModal(false)
      loadOrder()
    } catch (err) {
      console.error('Payment record failed:', err)
    }
  }

  const handleRecordDelivery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order || !user) return

    try {
      await dataService.markDelivered(order.id, {
        delivered_by: user.id,
        delivery_method: deliveryMethod,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        notes: deliveryNotes,
      })
      setShowDeliveryModal(false)
      loadOrder()
    } catch (err) {
      console.error('Delivery record failed:', err)
    }
  }

  const handleStartAudio = async () => {
    if (!order) return
    try {
      await dataService.updateOrderStatus(order.id, 'AUDIO_IN_PROGRESS', 'অডিও ডিজাইনার কাজ শুরু করেছেন।')
      await loadOrder()
    } catch (err) {
      console.error('Start audio failed:', err)
    }
  }

  const handleCompleteAudio = async () => {
    if (!order) return
    try {
      const nextStatus = order.video_required ? 'VIDEO_PENDING' : 'READY_FOR_DELIVERY'
      await dataService.updateOrderStatus(order.id, nextStatus, 'অডিও কাজ সম্পন্ন করা হয়েছে।')
      dataService.notifyAudioCompleted(order)
      await loadOrder()
    } catch (err) {
      console.error('Complete audio failed:', err)
    }
  }

  const handleStartVideo = async () => {
    if (!order) return
    try {
      await dataService.updateOrderStatus(order.id, 'VIDEO_IN_PROGRESS', 'ভিডিও এডিটর কাজ শুরু করেছেন।')
      await loadOrder()
    } catch (err) {
      console.error('Start video failed:', err)
    }
  }

  const handleCompleteVideo = async () => {
    if (!order) return
    try {
      await dataService.updateOrderStatus(order.id, 'READY_FOR_DELIVERY', 'ভিডিও কাজ সম্পন্ন করা হয়েছে।')
      dataService.notifyVideoCompleted(order)
      await loadOrder()
    } catch (err) {
      console.error('Complete video failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-xs">
        অর্ডারের তথ্য লোড হচ্ছে...
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-3">
        <p className="text-base font-bold text-white">অর্ডার খুঁজে পাওয়া যায়নি</p>
        <Link to="/orders" className="text-xs text-blue-400 underline">
          অর্ডার তালিকায় ফিরে যান
        </Link>
      </div>
    )
  }

  // Visual workflow progress steps
  const steps = [
    { key: 'NEW', label: 'নতুন অর্ডার' },
    { key: 'AUDIO', label: 'অডিও প্রোডাকশন' },
    ...(order.video_required ? [{ key: 'VIDEO', label: 'ভিডিও প্রোডাকশন' }] : []),
    { key: 'QC', label: 'কোয়ালিটি চেক' },
    { key: 'DELIVERY', label: 'ডেলিভারি' },
  ]

  const currentStepNum = STATUS_MAP_BN[order.overall_status]?.step || 1

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-xl tracking-tight">
                {order.order_number}
              </span>
              <StatusBadge status={order.overall_status} />
            </div>
            <h1 className="text-sm font-medium text-slate-300 mt-0.5">{order.title}</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Invoice / Cash Memo Button */}
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold rounded-xl shadow transition cursor-pointer"
            title="গ্রাহক মানি রসিদ ও ইনভয়েস প্রিন্ট"
          >
            <Receipt className="h-3.5 w-3.5 text-blue-400" />
            <span>মানি রসিদ ও ইনভয়েস</span>
          </button>

          {/* Edit Order Button for Super Admin, Order Manager & Delivery Manager */}
          {hasRole(['SUPER_ADMIN', 'ORDER_MANAGER', 'DELIVERY_MANAGER']) && (
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold rounded-xl shadow transition cursor-pointer"
              title="অর্ডার তথ্য ও মূল্য সম্পাদনা"
            >
              <Edit3 className="h-3.5 w-3.5 text-amber-400" />
              <span>অর্ডার সম্পাদনা</span>
            </button>
          )}

          {/* Delete Order Button for Super Admin, Order Manager & Delivery Manager */}
          {hasRole(['SUPER_ADMIN', 'ORDER_MANAGER', 'DELIVERY_MANAGER']) && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-xl shadow transition cursor-pointer"
              title="অর্ডারটি স্থায়ীভাবে মুছে ফেলুন"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              <span>অর্ডার মুছুন</span>
            </button>
          )}

          {order.due_amount > 0 && hasRole(['SUPER_ADMIN', 'ACCOUNTANT', 'ORDER_MANAGER']) && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
            >
              <DollarSign className="h-4 w-4" />
              <span>পেমেন্ট সংগ্রহ</span>
            </button>
          )}

          {/* Workflow Action Buttons */}
          {order.overall_status === 'AUDIO_PENDING' && hasRole(['SUPER_ADMIN', 'AUDIO_DESIGNER']) && (
            <button
              onClick={handleStartAudio}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>অডিও কাজ শুরু করুন</span>
            </button>
          )}

          {['AUDIO_IN_PROGRESS', 'AUDIO_REVISION', 'AUDIO_QC'].includes(order.overall_status) && hasRole(['SUPER_ADMIN', 'AUDIO_DESIGNER']) && (
            <button
              onClick={handleCompleteAudio}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/30 transition cursor-pointer"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>অডিও সম্পন্ন</span>
            </button>
          )}

          {order.overall_status === 'VIDEO_PENDING' && hasRole(['SUPER_ADMIN', 'VIDEO_EDITOR']) && (
            <button
              onClick={handleStartVideo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>ভিডিও কাজ শুরু করুন</span>
            </button>
          )}

          {['VIDEO_IN_PROGRESS', 'VIDEO_REVISION', 'VIDEO_QC'].includes(order.overall_status) && hasRole(['SUPER_ADMIN', 'VIDEO_EDITOR']) && (
            <button
              onClick={handleCompleteVideo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/30 transition cursor-pointer"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>ভিডিও সম্পন্ন</span>
            </button>
          )}

          {order.overall_status === 'READY_FOR_DELIVERY' && hasRole(['SUPER_ADMIN', 'DELIVERY_MANAGER', 'ORDER_MANAGER']) && (
            <button
              onClick={() => setShowDeliveryModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl shadow-md transition animate-pulse cursor-pointer"
            >
              <Truck className="h-4 w-4" />
              <span>ডেলিভারি সম্পন্ন করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Production Workflow Stepper Bar */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-x-auto">
        <div className="flex items-center justify-between min-w-[500px] px-4 py-2">
          {steps.map((step, idx) => {
            const isDone = order.overall_status === 'DELIVERED' || idx * 2.5 <= currentStepNum
            const isCurrent = !isDone && idx * 2.5 <= currentStepNum + 1.5

            return (
              <div key={step.key} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? '✓' : formatBengaliNumber(idx + 1)}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isDone ? 'text-slate-200' : isCurrent ? 'text-blue-400 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 ${
                      isDone ? 'bg-emerald-500/50' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Client Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            ক্লায়েন্টের তথ্য
          </span>
          <div className="text-sm font-bold text-white flex items-center gap-1.5">
            <User className="h-4 w-4 text-blue-400" />
            <span>{order.client_name}</span>
          </div>
          <div className="text-xs text-slate-300 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <span>{order.client_phone}</span>
          </div>
          {order.client_address && (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{order.client_address}</span>
            </div>
          )}
        </div>

        {/* Deadline & Dates */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            তারিখ ও ডেডলাইন
          </span>
          <div className="text-xs text-slate-300 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>গ্রহণ: {formatBengaliDate(order.created_at)}</span>
          </div>
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>ডেডলাইন: {formatBengaliDate(order.deadline)}</span>
          </div>
        </div>

        {/* Assignments */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            টিম অ্যাসাইনমেন্ট
          </span>
          <div className="text-xs text-slate-300 flex items-center gap-1.5">
            <Headphones className="h-3.5 w-3.5 text-blue-400" />
            <span>অডিও: {order.assigned_audio_staff?.bengali_name || 'অ্যাসাইন হয়নি'}</span>
          </div>
          {order.video_required && (
            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-cyan-400" />
              <span>ভিডিও: {order.assigned_video_staff?.bengali_name || 'অ্যাসাইন হয়নি'}</span>
            </div>
          )}
        </div>

        {/* Financials */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            বিলিং অবস্থা
          </span>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>মোট মূল্য:</span>
            <span className="font-bold text-white">{formatCurrency(order.total_amount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>পরিশোধিত:</span>
            <span className="font-bold text-emerald-400">{formatCurrency(order.paid_amount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs border-t border-slate-800 pt-1">
            <span className="font-semibold text-amber-400">বকেয়া:</span>
            <span className="font-bold text-amber-400">{formatCurrency(order.due_amount)}</span>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'details'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          কাজের বিবরণ ও ডাইনামিক ফিল্ড
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'submissions'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>প্রোডাকশন ফাইল ও কিউসি</span>
          {submissions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-[10px]">
              {formatBengaliNumber(submissions.length)}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'comments'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>ইন্টারনাল আলোচনা</span>
          {comments.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-[10px]">
              {formatBengaliNumber(comments.length)}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: DETAILS */}
      {activeTab === 'details' && (() => {
        const detailsObj: any = Array.isArray(order.details) ? order.details[0] || {} : order.details || {}
        const election = detailsObj.election_details && detailsObj.election_details.candidate_name ? detailsObj.election_details : null
        const waz = detailsObj.waz_details && detailsObj.waz_details.event_name ? detailsObj.waz_details : null
        const school = detailsObj.school_madrasa_details && detailsObj.school_madrasa_details.institution_name ? detailsObj.school_madrasa_details : null

        return (
          <div className="space-y-6">
            {/* Dynamic Category Specific Data */}
            {election && (
              <div className="p-6 rounded-3xl bg-blue-950/20 border border-blue-500/30 space-y-3">
                <h3 className="text-sm font-bold text-blue-400">নির্বাচনী তথ্য ও বিশেষ স্লোগান</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">প্রার্থীর নাম:</span>
                    <span className="font-semibold text-white">{election.candidate_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">পদবী:</span>
                    <span className="font-semibold text-white">{election.candidate_position}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">নির্বাচনী এলাকা:</span>
                    <span className="font-semibold text-white">{election.election_area}</span>
                  </div>
                  {election.election_symbol && (
                    <div>
                      <span className="text-slate-400 block">প্রতীক:</span>
                      <span className="font-bold text-amber-400">{election.election_symbol}</span>
                    </div>
                  )}
                  {election.song_style && (
                    <div>
                      <span className="text-slate-400 block">গানের সুরের ধরন:</span>
                      <span className="font-semibold text-white">{election.song_style}</span>
                    </div>
                  )}
                  {election.union_or_ward && (
                    <div>
                      <span className="text-slate-400 block">ইউনিয়ন / ওয়ার্ড:</span>
                      <span className="font-semibold text-white">{election.union_or_ward}</span>
                    </div>
                  )}
                  {election.campaign_message && (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <span className="text-slate-400 block">প্রচারণার স্লোগান:</span>
                      <p className="font-medium text-slate-200 mt-0.5">{election.campaign_message}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {waz && (
              <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <h3 className="text-sm font-bold text-emerald-400">ওয়াজ মাহফিলের মাইকিং বিবরণ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">মাহফিলের নাম:</span>
                    <span className="font-semibold text-white">{waz.event_name}</span>
                  </div>
                  {waz.institution_name && (
                    <div>
                      <span className="text-slate-400 block">আয়োজক:</span>
                      <span className="font-semibold text-white">{waz.institution_name}</span>
                    </div>
                  )}
                  {waz.event_location && (
                    <div>
                      <span className="text-slate-400 block">স্থান:</span>
                      <span className="font-semibold text-white">{waz.event_location}</span>
                    </div>
                  )}
                  {waz.event_date_time && (
                    <div>
                      <span className="text-slate-400 block">তারিখ ও সময়:</span>
                      <span className="font-semibold text-amber-400">{waz.event_date_time}</span>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block">বক্তাগণ:</span>
                    <span className="font-semibold text-white">
                      {Array.isArray(waz.speakers) && waz.speakers.length > 0
                        ? waz.speakers.join(', ')
                        : (typeof waz.speakers === 'string' ? waz.speakers : '—')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {school && (
              <div className="p-6 rounded-3xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                <h3 className="text-sm font-bold text-amber-400">স্কুল / মাদ্রাসা ভর্তি বিবরণ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">প্রতিষ্ঠানের নাম:</span>
                    <span className="font-semibold text-white">{school.institution_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">সেশন ও শ্রেণি:</span>
                    <span className="font-semibold text-white">
                      {school.admission_session} {school.available_classes ? `(${school.available_classes})` : ''}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* General Description & Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white block">কাজের বিস্তারিত বর্ণনা</span>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {order.description || 'কোন অতিরিক্ত বিবরণ দেওয়া হয়নি।'}
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-blue-400 block">স্টুডিও অভ্যন্তরীণ নির্দেশনা</span>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {order.internal_instructions || 'কোন অভ্যন্তরীণ নির্দেশনা দেওয়া হয়নি।'}
                </p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* TAB 2: SUBMISSIONS & QC */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">আপলোডকৃত প্রোডাকশন ফাইল ও অনুমোদন স্থিতি</h3>
            <span className="text-xs text-slate-400">মোট {formatBengaliNumber(submissions.length)} টি ফাইল</span>
          </div>

          {submissions.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
              এখনো কোনো প্রোডাকশন ফাইল সাবমিট করা হয়নি। অডিও অথবা ভিডিও ডিপার্টমেন্ট ফাইল আপলোড করলে এখানে প্রদর্শিত হবে।
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{sub.file_name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-400">
                        সংস্করণ v{formatBengaliNumber(sub.version_number)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          sub.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : sub.status === 'REVISION_REQUESTED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {sub.status === 'APPROVED'
                          ? 'অনুমোদিত'
                          : sub.status === 'REVISION_REQUESTED'
                          ? 'রিভিশন নির্দেশিত'
                          : 'পর্যালোচনার অপেক্ষায়'}
                      </span>
                    </div>
                    {sub.notes && <p className="text-xs text-slate-400">{sub.notes}</p>}
                    <div className="text-[10px] text-slate-500">
                      আপলোডকারী: {sub.submitter?.bengali_name || 'স্টাফ'} • {formatBengaliDate(sub.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {sub.google_drive_link && (
                      <a
                        href={sub.google_drive_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-medium inline-flex items-center gap-1 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>ড্রাইভ ফাইল</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INTERNAL COMMENTS */}
      {activeTab === 'comments' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            <span>অর্ডারের অভ্যন্তরীণ আলোচনা ও নোট</span>
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {comments.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6">
                এখনো কোনো আলোচনা নেই। নিচের বক্সে মন্তব্য লিখে শেয়ার করুন।
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-400">
                      {c.user?.bengali_name || c.user?.full_name || 'স্টাফ'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(c.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{c.message}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendComment} className="flex gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="একটি অভ্যন্তরীণ মন্তব্য বা নির্দেশনা লিখুন..."
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={sendingComment || !newComment.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <Send className="h-3.5 w-3.5" />
              <span>পোস্ট</span>
            </button>
          </form>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">পেমেন্ট সংগ্রহ ও ভাউচার</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">পেমেন্টের পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  min="1"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">পেমেন্ট মাধ্যম</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  {Object.entries(PAYMENT_METHOD_MAP_BN).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">ট্রানজেকশন আইডি / রেফারেন্স</label>
                <input
                  type="text"
                  value={trxRef}
                  onChange={(e) => setTrxRef(e.target.value)}
                  placeholder="যেমন: TRX998822 বা ক্যাশ রশিদ নং"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">মন্তব্য</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="অর্ডার বকেয়া পরিশোধ"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD DELIVERY MODAL */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm">চূড়ান্ত ডেলিভারি রেকর্ড</h3>
              <button onClick={() => setShowDeliveryModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordDelivery} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">ডেলিভারি মাধ্যম</label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  <option value="WHATSAPP">হোয়াটসঅ্যাপ (WhatsApp)</option>
                  <option value="PENDRIVE">পেনড্রাইভ / মেমোরি কার্ড</option>
                  <option value="EMAIL">ইমেইল (Email)</option>
                  <option value="ONLINE">গুগল ড্রাইভ লিংক (Online)</option>
                  <option value="OTHER">অন্যান্য</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">গ্রহণকারীর নাম</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">গ্রহণকারীর ফোন নম্বর</label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">ডেলিভারি নোট</label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="ফাইনাল ফাইল সফলভাবে বুঝিয়ে দেওয়া হয়েছে।"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold"
                >
                  ডেলিভারি কনফার্ম করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice & Money Receipt Modal */}
      {order && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          order={order}
        />
      )}

      {/* Edit Order Modal */}
      {order && (
        <EditOrderModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          order={order}
          staffList={staffList}
          onOrderUpdated={loadOrder}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && order && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0f172a] border border-rose-500/30 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">অর্ডারটি কি মুছে ফেলতে চান?</h3>
                <p className="text-xs text-rose-400 font-mono font-semibold">{order.order_number}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="font-semibold text-slate-200">{order.title}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                সতর্কতা: একবার মুছে ফেললে এই অর্ডারের তথ্য, পেমেন্ট হিসাব ও অভ্যন্তরীণ আলোচনা স্থায়ীভাবে অপসারিত হবে।
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={deleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{deleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
