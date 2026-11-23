import { Profile, OrderCategory, Order, ExpenseCategory, Expense, Payment, NotificationItem } from '../types/database'

// No dummy staff - users register real accounts
export const INITIAL_STAFF: Profile[] = []

// Real production studio categories (Not dummy data)
export const INITIAL_CATEGORIES: OrderCategory[] = [
  {
    id: 'cat-01',
    name: 'Election Campaign Song',
    name_bn: 'নির্বাচনী প্রচারণা গান',
    slug: 'election-song',
    dynamic_form_type: 'ELECTION',
    icon: 'Vote',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'cat-02',
    name: 'Election Promotional Video',
    name_bn: 'নির্বাচনী প্রচার ভিডিও',
    slug: 'election-video',
    dynamic_form_type: 'ELECTION',
    icon: 'Video',
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'cat-03',
    name: 'Waz Mahfil Miking Ad',
    name_bn: 'ওয়াজ মাহফিল মাইকিং বিজ্ঞাপন',
    slug: 'waz-mahfil',
    dynamic_form_type: 'WAZ',
    icon: 'Mic',
    is_active: true,
    sort_order: 3,
  },
  {
    id: 'cat-04',
    name: 'School Admission Ad',
    name_bn: 'স্কুল ভর্তি বিজ্ঞাপন',
    slug: 'school-admission',
    dynamic_form_type: 'ADMISSION',
    icon: 'GraduationCap',
    is_active: true,
    sort_order: 4,
  },
  {
    id: 'cat-05',
    name: 'Madrasa Admission Ad',
    name_bn: 'মাদ্রাসা ভর্তি বিজ্ঞাপন',
    slug: 'madrasa-admission',
    dynamic_form_type: 'ADMISSION',
    icon: 'BookOpen',
    is_active: true,
    sort_order: 5,
  },
  {
    id: 'cat-06',
    name: 'Islamic Ghazal & Nasheed',
    name_bn: 'ইসলামিক গজল ও নাশিদ',
    slug: 'islamic-ghazal',
    dynamic_form_type: 'GENERAL',
    icon: 'Music',
    is_active: true,
    sort_order: 6,
  },
  {
    id: 'cat-07',
    name: 'Commercial Promo Audio',
    name_bn: 'ব্যবসায়িক প্রচার অডিও',
    slug: 'commercial-audio',
    dynamic_form_type: 'GENERAL',
    icon: 'Radio',
    is_active: true,
    sort_order: 7,
  },
  {
    id: 'cat-08',
    name: 'Audio & Video Production',
    name_bn: 'অডিও ও ভিডিও প্রোডাকশন',
    slug: 'full-production',
    dynamic_form_type: 'GENERAL',
    icon: 'Film',
    is_active: true,
    sort_order: 8,
  },
  {
    id: 'cat-09',
    name: 'Other Custom Production',
    name_bn: 'অন্যান্য কাস্টম অর্ডার',
    slug: 'custom-order',
    dynamic_form_type: 'GENERAL',
    icon: 'Layers',
    is_active: true,
    sort_order: 9,
  },
]

// Real studio expense heads
export const INITIAL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'expcat-01', name: 'Staff Salary', name_bn: 'স্টাফ বেতন', is_default: true },
  { id: 'expcat-02', name: 'Studio Rent', name_bn: 'স্টুডিও ভাড়া', is_default: true },
  { id: 'expcat-03', name: 'Electricity Bill', name_bn: 'বিদ্যুৎ বিল', is_default: true },
  { id: 'expcat-04', name: 'Internet Bill', name_bn: 'ইন্টারনেট বিল', is_default: true },
  { id: 'expcat-05', name: 'Equipment Purchase', name_bn: 'যন্ত্রপাতি ক্রয়', is_default: true },
  { id: 'expcat-06', name: 'Equipment Maintenance', name_bn: 'যন্ত্রপাতি মেরামত ও রক্ষণাবেক্ষণ', is_default: true },
  { id: 'expcat-07', name: 'Software Subscription', name_bn: 'সফটওয়্যার ও প্লাগইন', is_default: true },
  { id: 'expcat-08', name: 'Office Refreshment', name_bn: 'নাস্তা ও আপ্যায়ন', is_default: true },
  { id: 'expcat-09', name: 'Other Expenses', name_bn: 'অন্যান্য খরচ', is_default: true },
]

// All dummy orders removed - starts completely clean
export const INITIAL_ORDERS: Order[] = []

// All dummy payments removed
export const INITIAL_PAYMENTS: Payment[] = []

// All dummy expenses removed
export const INITIAL_EXPENSES: Expense[] = []

// All dummy notifications removed
export const INITIAL_NOTIFICATIONS: NotificationItem[] = []
