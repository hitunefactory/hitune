// Database Types for HI TUNE STUDIO

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'ORDER_MANAGER'
  | 'AUDIO_DESIGNER'
  | 'VIDEO_EDITOR'
  | 'QUALITY_CONTROLLER'
  | 'DELIVERY_MANAGER'
  | 'ACCOUNTANT'

export interface Profile {
  id: string
  email: string
  full_name: string
  bengali_name: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  roles: UserRole[]
  department: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type OrderCategorySlug = 
  | 'election-song'
  | 'election-video'
  | 'waz-mahfil'
  | 'school-admission'
  | 'madrasa-admission'
  | 'islamic-ghazal'
  | 'commercial-audio'
  | 'full-production'
  | 'custom-order'

export type DynamicFormType = 'ELECTION' | 'WAZ' | 'ADMISSION' | 'GENERAL'

export interface OrderCategory {
  id: string
  name: string
  name_bn: string
  slug: OrderCategorySlug | string
  dynamic_form_type: DynamicFormType
  icon?: string
  is_active: boolean
  sort_order: number
}

export type OrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type OrderOverallStatus = 
  | 'NEW'
  | 'AUDIO_PENDING'
  | 'AUDIO_IN_PROGRESS'
  | 'AUDIO_SUBMITTED'
  | 'AUDIO_QC'
  | 'AUDIO_REVISION'
  | 'VIDEO_PENDING'
  | 'VIDEO_IN_PROGRESS'
  | 'VIDEO_SUBMITTED'
  | 'VIDEO_QC'
  | 'VIDEO_REVISION'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID'
export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'BANK' | 'OTHER'

export interface ElectionOrderDetails {
  candidate_name: string
  candidate_position: string // যেমন: চেয়ারম্যান, মেয়র, এমপি, কাউন্সিলর
  election_area: string // যেমন: জামালপুর সদর, ওয়ার্ড নং ০৩
  union_or_ward: string
  election_symbol: string // যেমন: নৌকা, ধানের শীষ, হাতপাখা, ট্রাক ইত্যাদি
  campaign_message: string
  song_style: string // ফোক, বাউল, আধুনিক, ইত্যাদি
  special_instructions?: string
}

export interface WazOrderDetails {
  event_name: string // যেমন: বাৎসরিক তাফসিরুল কুরআন মাহফিল
  institution_name: string
  event_location: string
  event_date_time: string
  speakers: string[]
  chief_guest?: string
  president?: string
  special_announcements?: string
}

export interface SchoolMadrasaOrderDetails {
  institution_name: string
  address: string
  admission_session: string // যেমন: ২০২৬ শিক্ষাবর্ষ
  available_classes: string // প্লে থেকে দশম শ্রেণি
  facilities: string[]
  contact_numbers: string
  additional_instructions?: string
}

export interface Order {
  id: string
  order_number: string // HT-2026-0001
  title: string
  client_name: string
  client_phone: string
  client_email?: string | null
  client_address?: string | null
  category_id: string
  category?: OrderCategory
  priority: OrderPriority
  deadline: string | null
  audio_required: boolean
  video_required: boolean
  overall_status: OrderOverallStatus
  
  // Financials
  total_amount: number
  advance_amount: number
  discount_amount: number
  paid_amount: number
  due_amount: number
  payment_status: PaymentStatus

  // Instructions
  description: string | null
  internal_instructions: string | null

  // Assignments
  assigned_audio_staff_id?: string | null
  assigned_audio_staff?: Profile | null
  assigned_video_staff_id?: string | null
  assigned_video_staff?: Profile | null
  created_by?: string | null
  creator?: Profile | null

  // Dynamic Details
  details?: {
    election_details?: ElectionOrderDetails
    waz_details?: WazOrderDetails
    school_madrasa_details?: SchoolMadrasaOrderDetails
    custom_fields?: Record<string, any>
  }

  // Relations
  tasks?: OrderTask[]
  comments?: OrderComment[]
  attachments?: OrderAttachment[]
  submissions?: TaskSubmission[]
  payments?: Payment[]
  revisions?: Revision[]

  created_at: string
  updated_at: string
}

export type TaskType = 'AUDIO' | 'VIDEO' | 'QC' | 'DELIVERY'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED' | 'COMPLETED'

export interface OrderTask {
  id: string
  order_id: string
  task_type: TaskType
  status: TaskStatus
  assigned_to?: string | null
  assignee?: Profile | null
  started_at?: string | null
  completed_at?: string | null
  notes?: string | null
  submissions?: TaskSubmission[]
  created_at: string
  updated_at: string
}

export interface TaskSubmission {
  id: string
  task_id: string
  order_id: string
  submitted_by: string
  submitter?: Profile
  submission_type: 'PREVIEW' | 'FINAL'
  file_name: string
  file_url?: string | null
  file_type?: string | null
  file_size?: number | null
  google_drive_link?: string | null
  notes?: string | null
  version_number: number
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REVISION_REQUESTED'
  created_at: string
}

export interface OrderAttachment {
  id: string
  order_id: string
  file_name: string
  file_url?: string | null
  google_drive_link?: string | null
  file_type?: string | null
  file_size?: number | null
  attachment_type: 'REFERENCE' | 'LOGO' | 'SCRIPT' | 'AUDIO_RAW' | 'FINAL' | 'OTHER'
  uploaded_by?: string | null
  uploader?: Profile | null
  created_at: string
}

export interface OrderComment {
  id: string
  order_id: string
  user_id: string
  user?: Profile
  message: string
  mentions?: string[]
  created_at: string
}

export interface Revision {
  id: string
  order_id: string
  task_id?: string | null
  submission_id?: string | null
  department: 'AUDIO' | 'VIDEO'
  revision_number: number
  instructions: string
  requested_by: string
  requester?: Profile
  status: 'PENDING' | 'RESOLVED'
  created_at: string
}

export interface NotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  link?: string | null
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT'
  is_read: boolean
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  order_number?: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  transaction_reference?: string | null
  notes?: string | null
  recorded_by?: string | null
  recorder?: Profile | null
  created_at: string
}

export interface ExpenseCategory {
  id: string
  name: string
  name_bn: string
  is_default: boolean
}

export interface Expense {
  id: string
  category_id?: string | null
  category?: ExpenseCategory | null
  title: string
  amount: number
  expense_date: string
  payment_method: PaymentMethod
  reference_no?: string | null
  receipt_url?: string | null
  notes?: string | null
  recorded_by?: string | null
  recorder?: Profile | null
  created_at: string
}

export interface Delivery {
  id: string
  order_id: string
  delivered_by?: string | null
  delivery_date: string
  delivery_method: 'ONLINE' | 'PENDRIVE' | 'WHATSAPP' | 'EMAIL' | 'OTHER'
  recipient_name: string
  recipient_phone: string
  final_files_summary?: string | null
  notes?: string | null
  confirmation_status: string
  created_at: string
}
