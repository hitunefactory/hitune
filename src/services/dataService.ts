import { supabase, isSupabaseConfigured, checkSupabaseHealth } from '../integrations/supabase/client'
import {
  Order,
  Profile,
  OrderCategory,
  Expense,
  ExpenseCategory,
  Payment,
  NotificationItem,
  OrderComment,
  Revision,
  TaskSubmission,
  OrderOverallStatus,
  PaymentMethod,
} from '../types/database'
import {
  INITIAL_STAFF,
  INITIAL_CATEGORIES,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_NOTIFICATIONS,
} from './mockData'

// Fresh production storage keys (purges any older demo items)
const STORAGE_KEYS = {
  ORDERS: 'hitune_prod_orders_v2',
  STAFF: 'hitune_prod_staff_v2',
  CATEGORIES: 'hitune_prod_categories_v2',
  PAYMENTS: 'hitune_prod_payments_v2',
  EXPENSES: 'hitune_prod_expenses_v2',
  EXPENSE_CATEGORIES: 'hitune_prod_expcat_v2',
  NOTIFICATIONS: 'hitune_prod_notifications_v2',
  COMMENTS: 'hitune_prod_comments_v2',
  SUBMISSIONS: 'hitune_prod_submissions_v2',
  REVISIONS: 'hitune_prod_revisions_v2',
}

// Purge any legacy dummy keys
try {
  ['hitune_orders_v1', 'hitune_staff_v1', 'hitune_payments_v1', 'hitune_expenses_v1', 'hitune_notifications_v1'].forEach((k) => {
    localStorage.removeItem(k)
  })
} catch {}

function loadLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultVal
    return JSON.parse(raw) as T
  } catch (err) {
    console.error(`Failed to load ${key} from localStorage`, err)
    return defaultVal
  }
}

function saveLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch (err) {
    console.error(`Failed to save ${key} to localStorage`, err)
  }
}

class DataService {
  private orders: Order[] = loadLocal(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
  private staff: Profile[] = loadLocal(STORAGE_KEYS.STAFF, INITIAL_STAFF)
  private categories: OrderCategory[] = loadLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
  private payments: Payment[] = loadLocal(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS)
  private expenses: Expense[] = loadLocal(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES)
  private expenseCategories: ExpenseCategory[] = loadLocal(STORAGE_KEYS.EXPENSE_CATEGORIES, INITIAL_EXPENSE_CATEGORIES)
  private notifications: NotificationItem[] = loadLocal(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
  private comments: Record<string, OrderComment[]> = loadLocal(STORAGE_KEYS.COMMENTS, {})
  private submissions: Record<string, TaskSubmission[]> = loadLocal(STORAGE_KEYS.SUBMISSIONS, {})
  private revisions: Record<string, Revision[]> = loadLocal(STORAGE_KEYS.REVISIONS, {})

  private liveTablesAvailable: boolean | null = null

  async checkLiveSupport(): Promise<boolean> {
    if (!isSupabaseConfigured) return false
    if (this.liveTablesAvailable !== null) return this.liveTablesAvailable
    const health = await checkSupabaseHealth()
    this.liveTablesAvailable = health.tablesCreated
    return this.liveTablesAvailable
  }

  // -------------------------------------------------------------
  // ORDERS
  // -------------------------------------------------------------
  async getOrders(): Promise<Order[]> {
    if (await this.checkLiveSupport()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            category:order_categories(*),
            assigned_audio_staff:assigned_audio_staff_id(*),
            assigned_video_staff:assigned_video_staff_id(*)
          `)
          .order('created_at', { ascending: false })
        if (!error && data) return data as Order[]
      } catch (err) {
        console.warn('Supabase getOrders query error, using local fallback:', err)
      }
    }
    return [...this.orders]
  }

  async getOrderById(id: string): Promise<Order | null> {
    if (await this.checkLiveSupport()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            category:order_categories(*),
            details:order_details(*),
            assigned_audio_staff:assigned_audio_staff_id(*),
            assigned_video_staff:assigned_video_staff_id(*)
          `)
          .or(`id.eq.${id},order_number.eq.${id}`)
          .single()
        if (!error && data) return data as Order
      } catch (err) {
        console.warn('Supabase getOrderById error, using local fallback:', err)
      }
    }

    const found = this.orders.find((o) => o.id === id || o.order_number === id)
    if (!found) return null

    return {
      ...found,
      comments: this.comments[found.id] || [],
      revisions: this.revisions[found.id] || [],
    }
  }

  async createOrder(payload: Partial<Order> & { dynamic_details?: any }): Promise<Order> {
    const currentYear = new Date().getFullYear()
    const nextSeq = this.orders.length + 1
    const orderNumber = `HT-${currentYear}-${String(nextSeq).padStart(4, '0')}`
    const orderId = `ord-${Date.now()}`

    const cat = this.categories.find((c) => c.id === payload.category_id) || this.categories[0]
    const totalAmount = Number(payload.total_amount) || 0
    const advanceAmount = Number(payload.advance_amount) || 0
    const paidAmount = advanceAmount
    const dueAmount = Math.max(0, totalAmount - paidAmount)
    const paymentStatus = paidAmount <= 0 ? 'UNPAID' : dueAmount <= 0 ? 'PAID' : 'PARTIAL'

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      title: payload.title || 'নতুন অর্ডার',
      client_name: payload.client_name || '',
      client_phone: payload.client_phone || '',
      client_address: payload.client_address || '',
      category_id: cat.id,
      category: cat,
      priority: payload.priority || 'NORMAL',
      deadline: payload.deadline || null,
      audio_required: payload.audio_required ?? true,
      video_required: payload.video_required ?? false,
      overall_status: payload.audio_required ? 'AUDIO_PENDING' : payload.video_required ? 'VIDEO_PENDING' : 'NEW',
      total_amount: totalAmount,
      advance_amount: advanceAmount,
      discount_amount: 0,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_status: paymentStatus,
      description: payload.description || '',
      internal_instructions: payload.internal_instructions || '',
      assigned_audio_staff_id: payload.assigned_audio_staff_id || null,
      assigned_video_staff_id: payload.assigned_video_staff_id || null,
      created_by: payload.created_by || null,
      details: payload.dynamic_details ? { ...payload.dynamic_details } : {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (payload.assigned_audio_staff_id) {
      newOrder.assigned_audio_staff = this.staff.find((s) => s.id === payload.assigned_audio_staff_id) || null
    }
    if (payload.assigned_video_staff_id) {
      newOrder.assigned_video_staff = this.staff.find((s) => s.id === payload.assigned_video_staff_id) || null
    }

    this.orders.unshift(newOrder)
    saveLocal(STORAGE_KEYS.ORDERS, this.orders)

    if (await this.checkLiveSupport()) {
      try {
        await supabase.from('orders').insert({
          title: newOrder.title,
          client_name: newOrder.client_name,
          client_phone: newOrder.client_phone,
          client_address: newOrder.client_address,
          category_id: newOrder.category_id,
          priority: newOrder.priority,
          deadline: newOrder.deadline,
          audio_required: newOrder.audio_required,
          video_required: newOrder.video_required,
          total_amount: newOrder.total_amount,
          advance_amount: newOrder.advance_amount,
          paid_amount: newOrder.paid_amount,
          due_amount: newOrder.due_amount,
          payment_status: newOrder.payment_status,
          description: newOrder.description,
          internal_instructions: newOrder.internal_instructions,
        })
      } catch (e) {
        console.warn('Could not insert to live Supabase, local copy saved:', e)
      }
    }

    if (advanceAmount > 0) {
      await this.recordPayment({
        order_id: newOrder.id,
        order_number: newOrder.order_number,
        amount: advanceAmount,
        payment_method: 'CASH',
        notes: 'অর্ডার শুরুর সময় গৃহীত অগ্রিম পেমেন্ট',
        recorded_by: payload.created_by || undefined,
      })
    }

    if (newOrder.assigned_audio_staff_id) {
      this.createNotification({
        user_id: newOrder.assigned_audio_staff_id,
        title: 'নতুন অডিও কাজ বরাদ্দ করা হয়েছে',
        message: `${newOrder.order_number}: ${newOrder.title} এর অডিও প্রোডাকশন আপনাকে দেয়া হয়েছে।`,
        link: `/audio?orderId=${newOrder.id}`,
        type: 'INFO',
      })
    }

    return newOrder
  }

  async updateOrderStatus(orderId: string, status: OrderOverallStatus, notes?: string): Promise<Order> {
    const idx = this.orders.findIndex((o) => o.id === orderId)
    if (idx === -1) throw new Error('Order not found')

    this.orders[idx].overall_status = status
    this.orders[idx].updated_at = new Date().toISOString()
    saveLocal(STORAGE_KEYS.ORDERS, this.orders)

    if (notes) {
      await this.addComment(orderId, 'system', `[স্ট্যাটাস পরিবর্তন]: ${status}. মন্তব্য: ${notes}`)
    }

    return this.orders[idx]
  }

  async updateOrderDetails(orderId: string, updates: Partial<Order>): Promise<Order> {
    const idx = this.orders.findIndex((o) => o.id === orderId)
    if (idx === -1) throw new Error('Order not found')

    const existing = this.orders[idx]
    const updatedTotal = updates.total_amount !== undefined ? Number(updates.total_amount) : existing.total_amount
    const updatedPaid = updates.paid_amount !== undefined ? Number(updates.paid_amount) : existing.paid_amount
    const updatedDue = Math.max(0, updatedTotal - updatedPaid)

    this.orders[idx] = {
      ...existing,
      ...updates,
      total_amount: updatedTotal,
      paid_amount: updatedPaid,
      due_amount: updatedDue,
      updated_at: new Date().toISOString(),
    }
    saveLocal(STORAGE_KEYS.ORDERS, this.orders)

    if (await this.checkLiveSupport()) {
      try {
        await supabase
          .from('orders')
          .update({
            title: updates.title,
            client_name: updates.client_name,
            client_phone: updates.client_phone,
            client_address: updates.client_address,
            deadline: updates.deadline,
            priority: updates.priority,
            total_amount: updatedTotal,
            paid_amount: updatedPaid,
            due_amount: updatedDue,
            assigned_audio_staff_id: updates.assigned_audio_staff_id,
            assigned_video_staff_id: updates.assigned_video_staff_id,
            description: updates.description,
            internal_instructions: updates.internal_instructions,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
      } catch (e) {
        console.warn('Could not update order in Supabase:', e)
      }
    }

    return this.orders[idx]
  }

  // -------------------------------------------------------------
  // SUBMISSIONS & QUALITY CONTROL
  // -------------------------------------------------------------
  async submitWork(payload: {
    order_id: string
    department: 'AUDIO' | 'VIDEO'
    submitted_by: string
    submission_type: 'PREVIEW' | 'FINAL'
    file_name: string
    file_url?: string
    google_drive_link?: string
    file_type?: string
    file_size?: number
    notes?: string
  }): Promise<TaskSubmission> {
    const order = await this.getOrderById(payload.order_id)
    if (!order) throw new Error('Order not found')

    const existingList = this.submissions[payload.order_id] || []
    const versionNumber = existingList.filter((s) => s.file_type === payload.department).length + 1

    const newSub: TaskSubmission = {
      id: `sub-${Date.now()}`,
      task_id: `task-${payload.department.toLowerCase()}-${payload.order_id}`,
      order_id: payload.order_id,
      submitted_by: payload.submitted_by,
      submitter: this.staff.find((s) => s.id === payload.submitted_by),
      submission_type: payload.submission_type,
      file_name: payload.file_name,
      file_url: payload.file_url || null,
      google_drive_link: payload.google_drive_link || null,
      file_type: payload.file_type || (payload.department === 'AUDIO' ? 'audio/mpeg' : 'video/mp4'),
      file_size: payload.file_size || 5242880,
      notes: payload.notes || null,
      version_number: versionNumber,
      status: 'PENDING_REVIEW',
      created_at: new Date().toISOString(),
    }

    if (!this.submissions[payload.order_id]) {
      this.submissions[payload.order_id] = []
    }
    this.submissions[payload.order_id].unshift(newSub)
    saveLocal(STORAGE_KEYS.SUBMISSIONS, this.submissions)

    const nextStatus: OrderOverallStatus = payload.department === 'AUDIO' ? 'AUDIO_QC' : 'VIDEO_QC'
    await this.updateOrderStatus(payload.order_id, nextStatus)

    const qcStaff = this.staff.filter((s) => s.role === 'QUALITY_CONTROLLER' || s.roles.includes('QUALITY_CONTROLLER'))
    qcStaff.forEach((qc) => {
      this.createNotification({
        user_id: qc.id,
        title: `${payload.department === 'AUDIO' ? 'অডিও' : 'ভিডিও'} কোয়ালিটি চেকের জন্য প্রস্তুত`,
        message: `${order.order_number}: সংস্করণ v${versionNumber} সাবমিট করা হয়েছে। পর্যালোচনা করুন।`,
        link: `/quality-control`,
        type: 'WARNING',
      })
    })

    return newSub
  }

  async getSubmissions(orderId: string): Promise<TaskSubmission[]> {
    return this.submissions[orderId] || []
  }

  async approveSubmission(
    orderId: string,
    submissionId: string,
    qcUserId: string,
    notes?: string
  ): Promise<{ nextStatus: OrderOverallStatus }> {
    const order = await this.getOrderById(orderId)
    if (!order) throw new Error('Order not found')

    const subs = this.submissions[orderId] || []
    const sub = subs.find((s) => s.id === submissionId)
    if (sub) {
      sub.status = 'APPROVED'
      saveLocal(STORAGE_KEYS.SUBMISSIONS, this.submissions)
    }

    let nextStatus: OrderOverallStatus
    if (order.overall_status === 'AUDIO_QC' || order.overall_status === 'AUDIO_SUBMITTED') {
      if (order.video_required) {
        nextStatus = 'VIDEO_PENDING'
        if (order.assigned_video_staff_id) {
          this.createNotification({
            user_id: order.assigned_video_staff_id,
            title: 'অডিও অনুমোদিত - ভিডিও এডিটিং শুরু করুন',
            message: `${order.order_number} এর অডিও অনুমোদিত হয়েছে। অডিও ফাইল ডাউনলোড করে ভিডিও তৈরি শুরু করুন।`,
            link: `/video?orderId=${order.id}`,
            type: 'INFO',
          })
        }
      } else {
        nextStatus = 'READY_FOR_DELIVERY'
        this.notifyDeliveryTeam(order)
      }
    } else {
      nextStatus = 'READY_FOR_DELIVERY'
      this.notifyDeliveryTeam(order)
    }

    await this.updateOrderStatus(orderId, nextStatus, `কোয়ালিটি কন্ট্রোল দ্বারা অনুমোদিত। মন্তব্য: ${notes || 'সব ঠিক আছে।'}`)
    return { nextStatus }
  }

  async requestRevision(
    orderId: string,
    submissionId: string,
    department: 'AUDIO' | 'VIDEO',
    instructions: string,
    qcUserId: string
  ): Promise<Revision> {
    const order = await this.getOrderById(orderId)
    if (!order) throw new Error('Order not found')

    const subs = this.submissions[orderId] || []
    const sub = subs.find((s) => s.id === submissionId)
    if (sub) {
      sub.status = 'REVISION_REQUESTED'
      saveLocal(STORAGE_KEYS.SUBMISSIONS, this.submissions)
    }

    const revList = this.revisions[orderId] || []
    const revNumber = revList.length + 1

    const newRev: Revision = {
      id: `rev-${Date.now()}`,
      order_id: orderId,
      submission_id: submissionId,
      department,
      revision_number: revNumber,
      instructions,
      requested_by: qcUserId,
      requester: this.staff.find((s) => s.id === qcUserId),
      status: 'PENDING',
      created_at: new Date().toISOString(),
    }

    if (!this.revisions[orderId]) this.revisions[orderId] = []
    this.revisions[orderId].unshift(newRev)
    saveLocal(STORAGE_KEYS.REVISIONS, this.revisions)

    const revStatus: OrderOverallStatus = department === 'AUDIO' ? 'AUDIO_REVISION' : 'VIDEO_REVISION'
    await this.updateOrderStatus(orderId, revStatus, `রিভিশন অনুরোধ #${revNumber}: ${instructions}`)

    const targetStaffId = department === 'AUDIO' ? order.assigned_audio_staff_id : order.assigned_video_staff_id
    if (targetStaffId) {
      this.createNotification({
        user_id: targetStaffId,
        title: `রিভিশন প্রয়োজন (${department === 'AUDIO' ? 'অডিও' : 'ভিডিও'})`,
        message: `${order.order_number}: ${instructions}`,
        link: department === 'AUDIO' ? `/audio?orderId=${order.id}` : `/video?orderId=${order.id}`,
        type: 'ALERT',
      })
    }

    return newRev
  }

  private notifyDeliveryTeam(order: Order) {
    const deliveryStaff = this.staff.filter((s) => s.role === 'DELIVERY_MANAGER' || s.roles.includes('DELIVERY_MANAGER'))
    deliveryStaff.forEach((del) => {
      this.createNotification({
        user_id: del.id,
        title: 'অর্ডার ডেলিভারির জন্য প্রস্তুত!',
        message: `${order.order_number}: কোয়ালিটি টেস্ট পাশ করেছে। ক্লায়েন্ট ডেলিভারি নিশ্চিত করুন।`,
        link: `/delivery?orderId=${order.id}`,
        type: 'SUCCESS',
      })
    })
  }

  async markDelivered(
    orderId: string,
    payload: {
      delivered_by: string
      delivery_method: 'ONLINE' | 'PENDRIVE' | 'WHATSAPP' | 'EMAIL' | 'OTHER'
      recipient_name: string
      recipient_phone: string
      notes?: string
    }
  ): Promise<Order> {
    const updated = await this.updateOrderStatus(
      orderId,
      'DELIVERED',
      `ডেলিভারি সম্পন্ন হয়েছে (${payload.delivery_method})। গ্রহণকারী: ${payload.recipient_name} (${payload.recipient_phone})`
    )
    return updated
  }

  // -------------------------------------------------------------
  // COMMENTS
  // -------------------------------------------------------------
  async getComments(orderId: string): Promise<OrderComment[]> {
    return this.comments[orderId] || []
  }

  async addComment(orderId: string, userId: string, message: string): Promise<OrderComment> {
    const user = this.staff.find((s) => s.id === userId)
    const newComment: OrderComment = {
      id: `comment-${Date.now()}`,
      order_id: orderId,
      user_id: userId,
      user: user || undefined,
      message,
      created_at: new Date().toISOString(),
    }

    if (!this.comments[orderId]) this.comments[orderId] = []
    this.comments[orderId].push(newComment)
    saveLocal(STORAGE_KEYS.COMMENTS, this.comments)
    return newComment
  }

  // -------------------------------------------------------------
  // PAYMENTS & EXPENSES
  // -------------------------------------------------------------
  async getPayments(): Promise<Payment[]> {
    return [...this.payments]
  }

  async recordPayment(payload: {
    order_id: string
    order_number?: string
    amount: number
    payment_method: PaymentMethod
    transaction_reference?: string
    notes?: string
    recorded_by?: string
  }): Promise<Payment> {
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      order_id: payload.order_id,
      order_number: payload.order_number,
      amount: Number(payload.amount),
      payment_date: new Date().toISOString(),
      payment_method: payload.payment_method,
      transaction_reference: payload.transaction_reference || null,
      notes: payload.notes || null,
      recorded_by: payload.recorded_by || null,
      recorder: this.staff.find((s) => s.id === payload.recorded_by),
      created_at: new Date().toISOString(),
    }

    this.payments.unshift(newPayment)
    saveLocal(STORAGE_KEYS.PAYMENTS, this.payments)

    // Recalculate order financials
    const orderIdx = this.orders.findIndex((o) => o.id === payload.order_id)
    if (orderIdx !== -1) {
      const order = this.orders[orderIdx]
      const orderTotal = Number(order.total_amount) || 0
      const orderDiscount = Number(order.discount_amount) || 0
      
      const allOrderPayments = this.payments.filter((p) => p.order_id === order.id)
      const totalPaid = allOrderPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      const due = Math.max(0, (orderTotal - orderDiscount) - totalPaid)
      
      order.paid_amount = totalPaid
      order.due_amount = due
      order.payment_status = totalPaid <= 0 ? 'UNPAID' : due <= 0 ? 'PAID' : 'PARTIAL'
      order.updated_at = new Date().toISOString()
      
      saveLocal(STORAGE_KEYS.ORDERS, this.orders)
    }

    return newPayment
  }

  async getExpenses(): Promise<Expense[]> {
    return [...this.expenses]
  }

  async recordExpense(payload: {
    category_id: string
    title: string
    amount: number
    expense_date?: string
    payment_method: PaymentMethod
    reference_no?: string
    notes?: string
    recorded_by?: string
  }): Promise<Expense> {
    const cat = this.expenseCategories.find((c) => c.id === payload.category_id)
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      category_id: payload.category_id,
      category: cat || null,
      title: payload.title,
      amount: Number(payload.amount),
      expense_date: payload.expense_date || new Date().toISOString().split('T')[0],
      payment_method: payload.payment_method,
      reference_no: payload.reference_no || null,
      notes: payload.notes || null,
      recorded_by: payload.recorded_by || null,
      recorder: this.staff.find((s) => s.id === payload.recorded_by),
      created_at: new Date().toISOString(),
    }

    this.expenses.unshift(newExpense)
    saveLocal(STORAGE_KEYS.EXPENSES, this.expenses)
    return newExpense
  }

  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return [...this.expenseCategories]
  }

  async createExpenseCategory(name: string, name_bn: string): Promise<ExpenseCategory> {
    const newCat: ExpenseCategory = {
      id: `expcat-${Date.now()}`,
      name,
      name_bn,
      is_default: false,
    }
    this.expenseCategories.push(newCat)
    saveLocal(STORAGE_KEYS.EXPENSE_CATEGORIES, this.expenseCategories)
    return newCat
  }

  // -------------------------------------------------------------
  // DASHBOARD METRICS
  // -------------------------------------------------------------
  async getDashboardStats() {
    const orders = this.orders
    const totalOrders = orders.length
    const newOrders = orders.filter((o) => o.overall_status === 'NEW').length
    const pendingOrders = orders.filter((o) => 
      o.overall_status === 'AUDIO_PENDING' || o.overall_status === 'VIDEO_PENDING'
    ).length
    const audioInProgress = orders.filter((o) => o.overall_status === 'AUDIO_IN_PROGRESS').length
    const audioCompleted = orders.filter((o) => 
      ['VIDEO_PENDING', 'VIDEO_IN_PROGRESS', 'VIDEO_SUBMITTED', 'VIDEO_QC', 'READY_FOR_DELIVERY', 'DELIVERED'].includes(o.overall_status)
    ).length
    const videoInProgress = orders.filter((o) => o.overall_status === 'VIDEO_IN_PROGRESS').length
    const videoCompleted = orders.filter((o) => ['READY_FOR_DELIVERY', 'DELIVERED'].includes(o.overall_status)).length
    const revisionNeeded = orders.filter((o) => 
      o.overall_status === 'AUDIO_REVISION' || o.overall_status === 'VIDEO_REVISION'
    ).length
    const readyForDelivery = orders.filter((o) => o.overall_status === 'READY_FOR_DELIVERY').length
    const delivered = orders.filter((o) => o.overall_status === 'DELIVERED').length
    const cancelled = orders.filter((o) => o.overall_status === 'CANCELLED').length

    const todayStr = new Date().toISOString().split('T')[0]
    const todayOrders = orders.filter((o) => o.created_at.startsWith(todayStr))

    const totalReceivedPayments = this.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const totalOutstandingBalances = orders.reduce((sum, o) => sum + Number(o.due_amount), 0)
    const totalExpenses = this.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const netCashBalance = totalReceivedPayments - totalExpenses

    return {
      totalOrders,
      newOrders,
      pendingOrders,
      audioInProgress,
      audioCompleted,
      videoInProgress,
      videoCompleted,
      revisionNeeded,
      readyForDelivery,
      delivered,
      cancelled,
      todayOrdersCount: todayOrders.length,
      totalReceivedPayments,
      totalOutstandingBalances,
      totalExpenses,
      netCashBalance,
    }
  }

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------
  async getNotifications(userId?: string): Promise<NotificationItem[]> {
    if (!userId) return [...this.notifications]
    return this.notifications.filter((n) => n.user_id === userId)
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const notif = this.notifications.find((n) => n.id === id)
    if (notif) {
      notif.is_read = true
      saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications)
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    this.notifications.forEach((n) => {
      if (n.user_id === userId) n.is_read = true
    })
    saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications)
  }

  createNotification(item: Omit<NotificationItem, 'id' | 'is_read' | 'created_at'>): NotificationItem {
    const notif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    this.notifications.unshift(notif)
    saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications)
    return notif
  }

  // -------------------------------------------------------------
  // STAFF & CATEGORIES
  // -------------------------------------------------------------
  async getStaff(): Promise<Profile[]> {
    if (await this.checkLiveSupport()) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
        if (!error && data && data.length > 0) return data as Profile[]
      } catch (err) {
        console.warn('Supabase getStaff error:', err)
      }
    }
    return [...this.staff]
  }

  async createStaff(payload: Partial<Profile>): Promise<Profile> {
    const newStaff: Profile = {
      id: payload.id || `usr-${Date.now()}`,
      email: payload.email || `staff${Date.now()}@hitunestudio.com`,
      full_name: payload.full_name || 'নতুন কর্মী',
      bengali_name: payload.bengali_name || payload.full_name || 'নতুন কর্মী',
      phone: payload.phone || '',
      avatar_url: payload.avatar_url || '',
      role: payload.role || 'AUDIO_DESIGNER',
      roles: payload.roles || [payload.role || 'AUDIO_DESIGNER'],
      department: payload.department || 'AUDIO',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    this.staff.push(newStaff)
    saveLocal(STORAGE_KEYS.STAFF, this.staff)

    if (await this.checkLiveSupport()) {
      try {
        await supabase.from('profiles').upsert({
          id: newStaff.id,
          email: newStaff.email,
          full_name: newStaff.full_name,
          bengali_name: newStaff.bengali_name,
          phone: newStaff.phone,
          role: newStaff.role,
          roles: newStaff.roles,
          department: newStaff.department,
          is_active: true,
        })
      } catch (e) {
        console.warn('Could not upsert profile to Supabase:', e)
      }
    }

    return newStaff
  }

  async updateStaffProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const idx = this.staff.findIndex((s) => s.id === userId)
    if (idx !== -1) {
      this.staff[idx] = {
        ...this.staff[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      }
      saveLocal(STORAGE_KEYS.STAFF, this.staff)
    } else {
      const created: Profile = {
        id: userId,
        email: updates.email || '',
        full_name: updates.full_name || '',
        bengali_name: updates.bengali_name || updates.full_name || '',
        phone: updates.phone || '',
        avatar_url: updates.avatar_url || '',
        role: updates.role || 'AUDIO_DESIGNER',
        roles: updates.roles || ['AUDIO_DESIGNER'],
        department: updates.department || 'AUDIO',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...updates,
      }
      this.staff.push(created)
      saveLocal(STORAGE_KEYS.STAFF, this.staff)
    }

    if (await this.checkLiveSupport()) {
      try {
        await supabase
          .from('profiles')
          .update({
            full_name: updates.full_name,
            bengali_name: updates.bengali_name,
            phone: updates.phone,
            avatar_url: updates.avatar_url,
            department: updates.department,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
      } catch (e) {
        console.warn('Could not update profile in Supabase:', e)
      }
    }

    const updated = this.staff.find((s) => s.id === userId)
    return updated || (updates as Profile)
  }

  async getCategories(): Promise<OrderCategory[]> {
    return [...this.categories]
  }

  async createCategory(payload: { name: string; name_bn: string; slug: string; dynamic_form_type: any }): Promise<OrderCategory> {
    const newCat: OrderCategory = {
      id: `cat-${Date.now()}`,
      name: payload.name,
      name_bn: payload.name_bn,
      slug: payload.slug,
      dynamic_form_type: payload.dynamic_form_type || 'GENERAL',
      icon: 'Folder',
      is_active: true,
      sort_order: this.categories.length + 1,
    }
    this.categories.push(newCat)
    saveLocal(STORAGE_KEYS.CATEGORIES, this.categories)
    return newCat
  }
}

export const dataService = new DataService()
