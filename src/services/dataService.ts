import { supabase, isSupabaseConfigured, checkSupabaseHealth } from '../integrations/supabase/client'
import { getLocalDateString } from '../lib/utils'
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
  UserRole,
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

// Fresh production storage keys
const STORAGE_KEYS = {
  ORDERS: 'hitune_prod_orders_v2',
  STAFF: 'hitune_prod_staff_v2',
  CATEGORIES: 'hitune_prod_categories_v2',
  PAYMENTS: 'hitune_prod_payments_v2',
  EXPENSES: 'hitune_prod_expenses_v2',
  EXPENSE_CATEGORIES: 'hitune_prod_expcat_v2',
  NOTIFICATIONS: 'hitune_prod_notifications_v2',
  NOTIF_READ_DAY: 'hitune_prod_notif_read_day_v1',
  NOTIF_DISMISSED: 'hitune_prod_notif_dismissed_v1',
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

export const isUuid = (val?: string | null): boolean => {
  if (!val || typeof val !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim())
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
  private realtimeChannel: any = null

  initRealtimeSubscription(onUpdate?: () => void): () => void {
    if (!isSupabaseConfigured) return () => {}
    if (this.realtimeChannel) return () => {}

    try {
      this.realtimeChannel = supabase
        .channel('hitune_live_cloud_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          async () => {
            await this.getOrders()
            if (onUpdate) onUpdate()
            window.dispatchEvent(new CustomEvent('hitune:data-synced'))
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'payments' },
          async () => {
            await this.getPayments()
            if (onUpdate) onUpdate()
            window.dispatchEvent(new CustomEvent('hitune:data-synced'))
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'task_submissions' },
          async () => {
            if (onUpdate) onUpdate()
            window.dispatchEvent(new CustomEvent('hitune:data-synced'))
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          async () => {
            if (onUpdate) onUpdate()
            window.dispatchEvent(new CustomEvent('hitune:data-synced'))
          }
        )
        .subscribe()
    } catch (err) {
      console.warn('Realtime subscription error:', err)
    }

    return () => {
      if (this.realtimeChannel) {
        supabase.removeChannel(this.realtimeChannel)
        this.realtimeChannel = null
      }
    }
  }

  async checkLiveSupport(): Promise<boolean> {
    if (!isSupabaseConfigured) return false
    if (this.liveTablesAvailable !== null) return this.liveTablesAvailable
    const health = await checkSupabaseHealth()
    this.liveTablesAvailable = health.tablesCreated
    return this.liveTablesAvailable
  }

  // -------------------------------------------------------------
  // CLOUD SYNC ENGINE (PC <-> MOBILE AUTO-SYNC)
  // -------------------------------------------------------------
  async syncLocalOrderToCloud(order: Order): Promise<Order | null> {
    if (!isSupabaseConfigured) return null

    // 1. Resolve safe category UUID
    await this.getCategories()
    let safeCatId: string | null = isUuid(order.category_id) ? order.category_id : null
    if (!safeCatId && order.category) {
      const matched = this.categories.find(
        (c) => isUuid(c.id) && (c.slug === order.category?.slug || c.id === order.category?.id)
      )
      if (matched) safeCatId = matched.id
    }
    if (!safeCatId && this.categories.length > 0) {
      const firstValid = this.categories.find((c) => isUuid(c.id))
      if (firstValid) safeCatId = firstValid.id
    }

    // 2. Resolve safe staff UUIDs
    const safeAudioId = isUuid(order.assigned_audio_staff_id) ? order.assigned_audio_staff_id : null
    const safeVideoId = isUuid(order.assigned_video_staff_id) ? order.assigned_video_staff_id : null
    const safeCreatedBy = isUuid(order.created_by) ? order.created_by : null

    const insertPayload: any = {
      title: order.title,
      client_name: order.client_name,
      client_phone: order.client_phone,
      client_address: order.client_address || '',
      category_id: safeCatId,
      priority: order.priority || 'NORMAL',
      deadline: order.deadline || null,
      audio_required: order.audio_required ?? true,
      video_required: order.video_required ?? false,
      overall_status: order.overall_status || 'NEW',
      total_amount: Number(order.total_amount) || 0,
      advance_amount: Number(order.advance_amount) || 0,
      paid_amount: Number(order.paid_amount) || 0,
      due_amount: Number(order.due_amount) || 0,
      payment_status: order.payment_status || 'UNPAID',
      description: order.description || '',
      internal_instructions: order.internal_instructions || '',
      assigned_audio_staff_id: safeAudioId,
      assigned_video_staff_id: safeVideoId,
      created_by: safeCreatedBy,
      created_at: order.created_at || new Date().toISOString(),
    }

    if (order.order_number && order.order_number.startsWith('HT-')) {
      insertPayload.order_number = order.order_number
    }

    try {
      const { data: createdRow, error: insertError } = await supabase
        .from('orders')
        .insert(insertPayload)
        .select('*, category:order_categories(*)')
        .single()

      if (!insertError && createdRow) {
        const oldId = order.id
        order.id = createdRow.id
        order.order_number = createdRow.order_number || order.order_number
        if (createdRow.category) order.category = createdRow.category

        // Sync order details if available
        if (order.details && Object.keys(order.details).length > 0) {
          try {
            await supabase.from('order_details').insert({
              order_id: createdRow.id,
              ...order.details,
            })
          } catch {}
        }

        // If order was delivered, record in deliveries
        if (order.overall_status === 'DELIVERED') {
          try {
            await supabase.from('deliveries').upsert({
              order_id: createdRow.id,
              delivery_method: 'ONLINE',
              recipient_name: order.client_name,
              recipient_phone: order.client_phone,
              confirmation_status: 'DELIVERED',
              notes: 'অর্ডার সম্পন্ন ও ডেলিভারি নিশ্চিত করা হয়েছে',
            })
          } catch {}
        }

        // Remap comments / submissions keys in local memory
        if (this.comments[oldId]) {
          this.comments[createdRow.id] = this.comments[oldId]
          delete this.comments[oldId]
          saveLocal(STORAGE_KEYS.COMMENTS, this.comments)
        }
        if (this.submissions[oldId]) {
          this.submissions[createdRow.id] = this.submissions[oldId]
          delete this.submissions[oldId]
          saveLocal(STORAGE_KEYS.SUBMISSIONS, this.submissions)
        }
        if (this.revisions[oldId]) {
          this.revisions[createdRow.id] = this.revisions[oldId]
          delete this.revisions[oldId]
          saveLocal(STORAGE_KEYS.REVISIONS, this.revisions)
        }

        saveLocal(STORAGE_KEYS.ORDERS, this.orders)
        return order
      } else if (insertError) {
        console.warn('syncLocalOrderToCloud failed:', insertError.message)
      }
    } catch (err: any) {
      console.warn('syncLocalOrderToCloud exception:', err.message)
    }

    return null
  }

  async syncAllToCloud(): Promise<{ syncedOrdersCount: number; success: boolean }> {
    if (!isSupabaseConfigured) return { syncedOrdersCount: 0, success: false }

    let syncedCount = 0
    try {
      const { data: remoteOrders } = await supabase.from('orders').select('id, order_number')
      const remoteIds = new Set((remoteOrders || []).map((r: any) => r.id))
      const remoteNumbers = new Set((remoteOrders || []).map((r: any) => r.order_number))

      const unsynced = this.orders.filter(
        (o) => !remoteIds.has(o.id) && (!o.order_number || !remoteNumbers.has(o.order_number))
      )

      for (const ord of unsynced) {
        const res = await this.syncLocalOrderToCloud(ord)
        if (res) syncedCount++
      }

      // Re-fetch all orders to ensure full sync
      await this.getOrders()
      return { syncedOrdersCount: syncedCount, success: true }
    } catch (err) {
      console.warn('syncAllToCloud error:', err)
      return { syncedOrdersCount: syncedCount, success: false }
    }
  }

  // -------------------------------------------------------------
  // ORDERS
  // -------------------------------------------------------------
  async getOrders(): Promise<Order[]> {
    // 1. Ensure staff & categories are loaded
    if (this.staff.length === 0) {
      await this.getStaff()
    }
    if (this.categories.length === 0 || !this.categories.some((c) => isUuid(c.id))) {
      await this.getCategories()
    }

    if (await this.checkLiveSupport()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            category:order_categories(*)
          `)
          .order('created_at', { ascending: false })

        if (!error && data) {
          const liveOrders: Order[] = data.map((o: any) => ({
            ...o,
            category: o.category || this.categories.find((c) => c.id === o.category_id) || null,
            assigned_audio_staff: this.staff.find((s) => s.id === o.assigned_audio_staff_id) || null,
            assigned_video_staff: this.staff.find((s) => s.id === o.assigned_video_staff_id) || null,
            comments: this.comments[o.id] || [],
            revisions: this.revisions[o.id] || [],
          }))

          const liveIds = new Set(liveOrders.map((o) => o.id))
          const liveNumbers = new Set(liveOrders.map((o) => o.order_number))

          // Detect any local-only orders
          const localOnly = this.orders.filter(
            (loc) => !liveIds.has(loc.id) && (!loc.order_number || !liveNumbers.has(loc.order_number))
          )

          // Background upload any local-only orders to Supabase
          if (localOnly.length > 0) {
            for (const locOrder of localOnly) {
              this.syncLocalOrderToCloud(locOrder).catch(() => {})
            }
          }

          const merged = [...liveOrders, ...localOnly]
          this.orders = merged
          saveLocal(STORAGE_KEYS.ORDERS, this.orders)
          return merged
        } else if (error) {
          console.warn('Supabase getOrders query error, falling back to local storage:', error.message)
        }
      } catch (err) {
        console.warn('Supabase getOrders query exception, using local fallback:', err)
      }
    }

    // Always enrich local orders with staff before returning
    return this.orders.map((o) => ({
      ...o,
      assigned_audio_staff: o.assigned_audio_staff || this.staff.find((s) => s.id === o.assigned_audio_staff_id) || null,
      assigned_video_staff: o.assigned_video_staff || this.staff.find((s) => s.id === o.assigned_video_staff_id) || null,
    }))
  }

  async getOrderById(id: string): Promise<Order | null> {
    if (this.staff.length === 0) {
      await this.getStaff()
    }

    if (await this.checkLiveSupport()) {
      try {
        let query = supabase
          .from('orders')
          .select(`
            *,
            category:order_categories(*),
            details:order_details(*)
          `)

        if (isUuid(id)) {
          query = query.eq('id', id)
        } else {
          query = query.eq('order_number', id)
        }

        const { data, error } = await query.maybeSingle()

        if (!error && data) {
          const liveOrder: Order = {
            ...data,
            category: data.category || this.categories.find((c) => c.id === data.category_id) || null,
            assigned_audio_staff: this.staff.find((s) => s.id === data.assigned_audio_staff_id) || null,
            assigned_video_staff: this.staff.find((s) => s.id === data.assigned_video_staff_id) || null,
            comments: this.comments[data.id] || [],
            revisions: this.revisions[data.id] || [],
          }
          return liveOrder
        }
      } catch (err) {
        console.warn('Supabase getOrderById error, using local fallback:', err)
      }
    }

    const found = this.orders.find((o) => o.id === id || o.order_number === id)
    if (!found) return null

    return {
      ...found,
      assigned_audio_staff: found.assigned_audio_staff || this.staff.find((s) => s.id === found.assigned_audio_staff_id) || null,
      assigned_video_staff: found.assigned_video_staff || this.staff.find((s) => s.id === found.assigned_video_staff_id) || null,
      comments: this.comments[found.id] || [],
      revisions: this.revisions[found.id] || [],
    }
  }

  async createOrder(payload: Partial<Order> & { dynamic_details?: any }): Promise<Order> {
    const currentYear = new Date().getFullYear()
    const nextSeq = this.orders.length + 1
    const localOrderNumber = `HT-${currentYear}-${String(nextSeq).padStart(4, '0')}`
    const localOrderId = `ord-${Date.now()}`

    // 1. Resolve Category
    await this.getCategories() // ensure categories are loaded from Supabase
    let matchedCat = this.categories.find((c) => c.id === payload.category_id || c.slug === (payload.category as any)?.slug)
    if (!matchedCat && this.categories.length > 0) {
      matchedCat = this.categories[0]
    }

    const totalAmount = Number(payload.total_amount) || 0
    const advanceAmount = Number(payload.advance_amount) || 0
    const paidAmount = advanceAmount
    const dueAmount = Math.max(0, totalAmount - paidAmount)
    const paymentStatus = paidAmount <= 0 ? 'UNPAID' : dueAmount <= 0 ? 'PAID' : 'PARTIAL'
    const audioRequired = payload.audio_required ?? true
    const videoRequired = payload.video_required ?? false

    // Initial overall status
    const initialStatus: OrderOverallStatus = audioRequired
      ? 'AUDIO_PENDING'
      : videoRequired
      ? 'VIDEO_PENDING'
      : 'NEW'

    const newOrder: Order = {
      id: localOrderId,
      order_number: localOrderNumber,
      title: payload.title || 'নতুন অর্ডার',
      client_name: payload.client_name || '',
      client_phone: payload.client_phone || '',
      client_address: payload.client_address || '',
      category_id: matchedCat?.id || 'cat-general',
      category: matchedCat,
      priority: payload.priority || 'NORMAL',
      deadline: payload.deadline || null,
      audio_required: audioRequired,
      video_required: videoRequired,
      overall_status: initialStatus,
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

    // Attach staff references
    if (payload.assigned_audio_staff_id) {
      newOrder.assigned_audio_staff = this.staff.find((s) => s.id === payload.assigned_audio_staff_id) || null
    }
    if (payload.assigned_video_staff_id) {
      newOrder.assigned_video_staff = this.staff.find((s) => s.id === payload.assigned_video_staff_id) || null
    }

    // 2. Sync to Supabase directly
    if (await this.checkLiveSupport()) {
      try {
        const safeCategoryId = isUuid(matchedCat?.id) ? matchedCat?.id : null
        const safeAudioStaffId = isUuid(newOrder.assigned_audio_staff_id) ? newOrder.assigned_audio_staff_id : null
        const safeVideoStaffId = isUuid(newOrder.assigned_video_staff_id) ? newOrder.assigned_video_staff_id : null
        const safeCreatedBy = isUuid(newOrder.created_by) ? newOrder.created_by : null

        const insertPayload: any = {
          title: newOrder.title,
          client_name: newOrder.client_name,
          client_phone: newOrder.client_phone,
          client_address: newOrder.client_address,
          category_id: safeCategoryId,
          priority: newOrder.priority,
          deadline: newOrder.deadline,
          audio_required: newOrder.audio_required,
          video_required: newOrder.video_required,
          overall_status: newOrder.overall_status,
          total_amount: newOrder.total_amount,
          advance_amount: newOrder.advance_amount,
          paid_amount: newOrder.paid_amount,
          due_amount: newOrder.due_amount,
          payment_status: newOrder.payment_status,
          description: newOrder.description,
          internal_instructions: newOrder.internal_instructions,
          assigned_audio_staff_id: safeAudioStaffId,
          assigned_video_staff_id: safeVideoStaffId,
          created_by: safeCreatedBy,
        }

        const { data: createdRow, error: insertError } = await supabase
          .from('orders')
          .insert(insertPayload)
          .select('*, category:order_categories(*)')
          .single()

        if (!insertError && createdRow) {
          // Adopt Supabase's generated UUID and sequential order number
          newOrder.id = createdRow.id
          newOrder.order_number = createdRow.order_number || localOrderNumber
          if (createdRow.category) {
            newOrder.category = createdRow.category
          }

          // Insert dynamic order details if provided
          if (payload.dynamic_details && Object.keys(payload.dynamic_details).length > 0) {
            try {
              await supabase.from('order_details').insert({
                order_id: createdRow.id,
                ...payload.dynamic_details,
              })
            } catch (detailErr) {
              console.warn('Could not save order_details to Supabase:', detailErr)
            }
          }
        } else if (insertError) {
          console.warn('Supabase insert orders failed (saved to local fallback):', insertError.message)
        }
      } catch (e: any) {
        console.warn('Could not insert to live Supabase, local copy saved:', e.message)
      }
    }

    // Save to local storage
    this.orders.unshift(newOrder)
    saveLocal(STORAGE_KEYS.ORDERS, this.orders)

    // 3. Record Advance Payment if any
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

    // 4. Send Role-Targeted Notifications
    if (audioRequired) {
      if (newOrder.assigned_audio_staff_id) {
        this.createNotification({
          user_id: newOrder.assigned_audio_staff_id,
          title: 'নতুন অডিও কাজ বরাদ্দ করা হয়েছে',
          message: `${newOrder.order_number}: ${newOrder.title} এর অডিও প্রোডাকশন আপনাকে দেয়া হয়েছে।`,
          link: `/audio?orderId=${newOrder.id}`,
          type: 'INFO',
        })
      } else {
        const audioDesigners = this.staff.filter((s) => s.role === 'AUDIO_DESIGNER' || s.roles?.includes('AUDIO_DESIGNER'))
        audioDesigners.forEach((designer) => {
          this.createNotification({
            user_id: designer.id,
            title: 'নতুন অডিও কাজ এসেছে',
            message: `${newOrder.order_number}: ${newOrder.title} কাজের দায়িত্ব নিন।`,
            link: `/audio?orderId=${newOrder.id}`,
            type: 'INFO',
          })
        })
      }
    } else if (videoRequired) {
      // Pure video work (no audio needed)
      if (newOrder.assigned_video_staff_id) {
        this.createNotification({
          user_id: newOrder.assigned_video_staff_id,
          title: 'নতুন ভিডিও কাজ বরাদ্দ করা হয়েছে',
          message: `${newOrder.order_number}: ${newOrder.title} এর ভিডিও এডিটিং আপনাকে দেয়া হয়েছে।`,
          link: `/video?orderId=${newOrder.id}`,
          type: 'INFO',
        })
      } else {
        const videoEditors = this.staff.filter((s) => s.role === 'VIDEO_EDITOR' || s.roles?.includes('VIDEO_EDITOR'))
        videoEditors.forEach((editor) => {
          this.createNotification({
            user_id: editor.id,
            title: 'নতুন ভিডিও কাজ এসেছে',
            message: `${newOrder.order_number}: ${newOrder.title} ভিডিও কাজের দায়িত্ব নিন।`,
            link: `/video?orderId=${newOrder.id}`,
            type: 'INFO',
          })
        })
      }
    }

    return newOrder
  }

  async claimAudioOrder(orderId: string, staffId: string): Promise<Order> {
    const idx = this.orders.findIndex((o) => o.id === orderId)
    if (idx === -1) throw new Error('Order not found')

    const staffMember = this.staff.find((s) => s.id === staffId)
    this.orders[idx].assigned_audio_staff_id = staffId
    this.orders[idx].assigned_audio_staff = staffMember || null
    if (this.orders[idx].overall_status === 'AUDIO_PENDING' || this.orders[idx].overall_status === 'NEW') {
      this.orders[idx].overall_status = 'AUDIO_IN_PROGRESS'
    }
    this.orders[idx].updated_at = new Date().toISOString()
    saveLocal(STORAGE_KEYS.ORDERS, this.orders)

    if (await this.checkLiveSupport()) {
      try {
        const safeStaffId = isUuid(staffId) ? staffId : null
        let updateQuery = supabase
          .from('orders')
          .update({
            assigned_audio_staff_id: safeStaffId,
            overall_status: this.orders[idx].overall_status,
            updated_at: new Date().toISOString(),
          })

        if (isUuid(orderId)) {
          await updateQuery.eq('id', orderId)
        } else if (this.orders[idx].order_number) {
          await updateQuery.eq('order_number', this.orders[idx].order_number)
        }
      } catch (err) {
        console.warn('Supabase claimAudioOrder failed:', err)
      }
    }

    await this.addComment(orderId, staffId, `[অডিও দায়িত্ব গ্রহণ]: ${staffMember?.bengali_name || 'অডিও ডিজাইনার'} কাজের দায়িত্ব নিয়েছেন এবং কাজ শুরু করেছেন।`)
    await this.markOrderNotificationsAsRead(orderId, this.orders[idx].order_number, '/audio')
    return this.orders[idx]
  }

  async claimVideoOrder(orderId: string, staffId: string): Promise<Order> {
    const idx = this.orders.findIndex((o) => o.id === orderId)
    if (idx === -1) throw new Error('Order not found')

    const staffMember = this.staff.find((s) => s.id === staffId)
    this.orders[idx].assigned_video_staff_id = staffId
    this.orders[idx].assigned_video_staff = staffMember || null
    if (this.orders[idx].overall_status === 'VIDEO_PENDING' || this.orders[idx].overall_status === 'NEW') {
      this.orders[idx].overall_status = 'VIDEO_IN_PROGRESS'
    }
    this.orders[idx].updated_at = new Date().toISOString()
    saveLocal(STORAGE_KEYS.ORDERS, this.orders)

    if (await this.checkLiveSupport()) {
      try {
        const safeStaffId = isUuid(staffId) ? staffId : null
        let updateQuery = supabase
          .from('orders')
          .update({
            assigned_video_staff_id: safeStaffId,
            overall_status: this.orders[idx].overall_status,
            updated_at: new Date().toISOString(),
          })

        if (isUuid(orderId)) {
          await updateQuery.eq('id', orderId)
        } else if (this.orders[idx].order_number) {
          await updateQuery.eq('order_number', this.orders[idx].order_number)
        }
      } catch (err) {
        console.warn('Supabase claimVideoOrder failed:', err)
      }
    }

    await this.addComment(orderId, staffId, `[ভিডিও দায়িত্ব গ্রহণ]: ${staffMember?.bengali_name || 'ভিডিও এডিটর'} ভিডিও কাজের দায়িত্ব নিয়েছেন।`)
    await this.markOrderNotificationsAsRead(orderId, this.orders[idx].order_number, '/video')
    return this.orders[idx]
  }

  async updateOrderStatus(orderId: string, status: OrderOverallStatus, notes?: string): Promise<Order> {
    const idx = this.orders.findIndex((o) => o.id === orderId)
    if (idx === -1) throw new Error('Order not found')

    this.orders[idx].overall_status = status
    this.orders[idx].updated_at = new Date().toISOString()
    saveLocal(STORAGE_KEYS.ORDERS, this.orders)

    if (await this.checkLiveSupport()) {
      try {
        let updateQuery = supabase
          .from('orders')
          .update({
            overall_status: status,
            updated_at: new Date().toISOString(),
          })

        if (isUuid(orderId)) {
          await updateQuery.eq('id', orderId)
        } else if (this.orders[idx].order_number) {
          await updateQuery.eq('order_number', this.orders[idx].order_number)
        }
      } catch (e) {
        console.warn('Could not update order status in Supabase:', e)
      }
    }

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
        const updatePayload: any = {
          updated_at: new Date().toISOString(),
        }
        if (updates.title !== undefined) updatePayload.title = updates.title
        if (updates.client_name !== undefined) updatePayload.client_name = updates.client_name
        if (updates.client_phone !== undefined) updatePayload.client_phone = updates.client_phone
        if (updates.client_address !== undefined) updatePayload.client_address = updates.client_address
        if (updates.deadline !== undefined) updatePayload.deadline = updates.deadline
        if (updates.priority !== undefined) updatePayload.priority = updates.priority
        if (updates.total_amount !== undefined) updatePayload.total_amount = updatedTotal
        if (updates.paid_amount !== undefined) updatePayload.paid_amount = updatedPaid
        if (updates.due_amount !== undefined) updatePayload.due_amount = updatedDue
        if (updates.description !== undefined) updatePayload.description = updates.description
        if (updates.internal_instructions !== undefined) updatePayload.internal_instructions = updates.internal_instructions
        if (updates.assigned_audio_staff_id !== undefined) {
          updatePayload.assigned_audio_staff_id = isUuid(updates.assigned_audio_staff_id) ? updates.assigned_audio_staff_id : null
        }
        if (updates.assigned_video_staff_id !== undefined) {
          updatePayload.assigned_video_staff_id = isUuid(updates.assigned_video_staff_id) ? updates.assigned_video_staff_id : null
        }

        let updateQuery = supabase.from('orders').update(updatePayload)
        if (isUuid(orderId)) {
          await updateQuery.eq('id', orderId)
        } else if (existing.order_number) {
          await updateQuery.eq('order_number', existing.order_number)
        }
      } catch (e) {
        console.warn('Could not update order in Supabase:', e)
      }
    }

    return this.orders[idx]
  }

  async deleteOrder(orderId: string): Promise<boolean> {
    const idx = this.orders.findIndex((o) => o.id === orderId)
    if (idx === -1) return false

    const orderToDelete = this.orders[idx]
    this.orders.splice(idx, 1)
    saveLocal(STORAGE_KEYS.ORDERS, this.orders)

    // Remove local related data
    delete this.comments[orderId]
    delete this.submissions[orderId]
    delete this.revisions[orderId]
    saveLocal(STORAGE_KEYS.COMMENTS, this.comments)
    saveLocal(STORAGE_KEYS.SUBMISSIONS, this.submissions)
    saveLocal(STORAGE_KEYS.REVISIONS, this.revisions)

    // Clean up payments & notifications locally
    this.payments = this.payments.filter((p) => p.order_id !== orderId)
    saveLocal(STORAGE_KEYS.PAYMENTS, this.payments)

    const removedNotifIds: string[] = []
    this.notifications = this.notifications.filter((n) => {
      const matchesId = Boolean(n.link && n.link.includes(orderId))
      const matchesOrderNum = Boolean(orderToDelete.order_number && n.message?.includes(orderToDelete.order_number))
      if (matchesId || matchesOrderNum) {
        removedNotifIds.push(n.id)
        return false
      }
      return true
    })
    if (removedNotifIds.length > 0) {
      saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications)
      const dismissed = new Set(loadLocal<string[]>(STORAGE_KEYS.NOTIF_DISMISSED, []))
      removedNotifIds.forEach((rid) => dismissed.add(rid))
      saveLocal(STORAGE_KEYS.NOTIF_DISMISSED, Array.from(dismissed).slice(-500))
      this.emitNotificationsUpdated()
    }

    if (await this.checkLiveSupport()) {
      try {
        const targetId = isUuid(orderId) ? orderId : orderToDelete.id
        if (isUuid(targetId)) {
          // Delete child records first to satisfy foreign key constraints
          await Promise.allSettled([
            supabase.from('order_details').delete().eq('order_id', targetId),
            supabase.from('payments').delete().eq('order_id', targetId),
            supabase.from('order_comments').delete().eq('order_id', targetId),
            supabase.from('task_submissions').delete().eq('order_id', targetId),
            supabase.from('revisions').delete().eq('order_id', targetId),
            supabase.from('notifications').delete().ilike('link', `%${targetId}%`),
          ])
          // Delete the main order
          await supabase.from('orders').delete().eq('id', targetId)
        } else if (orderToDelete.order_number) {
          await Promise.allSettled([
            supabase.from('notifications').delete().ilike('message', `%${orderToDelete.order_number}%`),
            supabase.from('orders').delete().eq('order_number', orderToDelete.order_number),
          ])
        }
      } catch (err) {
        console.warn('Supabase deleteOrder failed:', err)
      }
    }

    window.dispatchEvent(new CustomEvent('hitune:data-synced'))
    return true
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

    // Sync to Supabase if order is stored in cloud
    if (await this.checkLiveSupport()) {
      try {
        const targetId = isUuid(payload.order_id) ? payload.order_id : order.id
        if (isUuid(targetId)) {
          const safeSubmitter = isUuid(payload.submitted_by) ? payload.submitted_by : null
          const { data: subRow } = await supabase.from('task_submissions').insert({
            order_id: targetId,
            submitted_by: safeSubmitter,
            submission_type: payload.submission_type,
            file_name: payload.file_name,
            file_url: payload.file_url || null,
            google_drive_link: payload.google_drive_link || null,
            file_type: newSub.file_type,
            file_size: newSub.file_size,
            notes: payload.notes || null,
            version_number: versionNumber,
            status: 'PENDING_REVIEW',
          }).select().maybeSingle()

          if (subRow) {
            newSub.id = subRow.id
          }
        }
      } catch (err) {
        console.warn('Supabase submitWork sync error:', err)
      }
    }

    const nextStatus: OrderOverallStatus = payload.department === 'AUDIO' ? 'AUDIO_QC' : 'VIDEO_QC'
    await this.updateOrderStatus(payload.order_id, nextStatus)

    const qcStaff = this.staff.filter((s) => s.role === 'QUALITY_CONTROLLER' || s.roles?.includes('QUALITY_CONTROLLER'))
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
    if (await this.checkLiveSupport()) {
      try {
        const ord = await this.getOrderById(orderId)
        const targetId = isUuid(orderId) ? orderId : ord?.id
        if (targetId && isUuid(targetId)) {
          const { data, error } = await supabase
            .from('task_submissions')
            .select('*')
            .eq('order_id', targetId)
            .order('version_number', { ascending: false })

          if (!error && data && data.length > 0) {
            const mapped: TaskSubmission[] = data.map((s: any) => ({
              ...s,
              submitter: this.staff.find((st) => st.id === s.submitted_by) || null,
            }))
            this.submissions[orderId] = mapped
            saveLocal(STORAGE_KEYS.SUBMISSIONS, this.submissions)
            return mapped
          }
        }
      } catch (err) {
        console.warn('Supabase getSubmissions error:', err)
      }
    }
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

    if (await this.checkLiveSupport() && isUuid(submissionId)) {
      try {
        await supabase.from('task_submissions').update({ status: 'APPROVED' }).eq('id', submissionId)
      } catch {}
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

    await this.updateOrderStatus(orderId, nextStatus, `কিউসি অনুমোদন সম্পন্ন। মন্তব্য: ${notes || 'মানসম্মত হয়েছে'}`)
    return { nextStatus }
  }

  async requestRevision(
    orderId: string,
    submissionId: string,
    department: 'AUDIO' | 'VIDEO',
    requestedBy: string,
    instructions: string
  ): Promise<Revision> {
    const order = await this.getOrderById(orderId)
    if (!order) throw new Error('Order not found')

    const subs = this.submissions[orderId] || []
    const sub = subs.find((s) => s.id === submissionId)
    if (sub) {
      sub.status = 'REVISION_REQUESTED'
      saveLocal(STORAGE_KEYS.SUBMISSIONS, this.submissions)
    }

    const existingRevs = this.revisions[orderId] || []
    const revNumber = existingRevs.length + 1

    const newRev: Revision = {
      id: `rev-${Date.now()}`,
      order_id: orderId,
      department,
      requested_by: requestedBy,
      requester: this.staff.find((s) => s.id === requestedBy),
      revision_number: revNumber,
      instructions,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    }

    if (!this.revisions[orderId]) this.revisions[orderId] = []
    this.revisions[orderId].unshift(newRev)
    saveLocal(STORAGE_KEYS.REVISIONS, this.revisions)

    if (await this.checkLiveSupport()) {
      try {
        const targetOrderId = isUuid(orderId) ? orderId : order.id
        if (isUuid(targetOrderId)) {
          const safeReq = isUuid(requestedBy) ? requestedBy : null
          await supabase.from('revisions').insert({
            order_id: targetOrderId,
            department,
            revision_number: revNumber,
            instructions,
            requested_by: safeReq,
            status: 'PENDING',
          })
        }
      } catch (err) {
        console.warn('Supabase requestRevision sync error:', err)
      }
    }

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

  notifyAudioCompleted(order: Order) {
    if (order.video_required) {
      if (order.assigned_video_staff_id) {
        this.createNotification({
          user_id: order.assigned_video_staff_id,
          title: 'অডিও সম্পন্ন — ভিডিও এডিটিং শুরু করুন',
          message: `${order.order_number}: ${order.title} এর অডিও কাজ শেষ হয়েছে। এখন ভিডিও এডিটিং শুরু করুন।`,
          link: `/video?orderId=${order.id}`,
          type: 'INFO',
        })
      } else {
        const videoStaff = this.staff.filter((s) => s.role === 'VIDEO_EDITOR' || s.roles?.includes('VIDEO_EDITOR'))
        videoStaff.forEach((v) => {
          this.createNotification({
            user_id: v.id,
            title: 'অডিও সম্পন্ন — ভিডিও কাজ প্রস্তুত',
            message: `${order.order_number}: ${order.title} এর অডিও কাজ সম্পন্ন। ভিডিও কাজের দায়িত্ব নিন।`,
            link: `/video?orderId=${order.id}`,
            type: 'INFO',
          })
        })
      }
    } else {
      this.notifyDeliveryTeam(order)
    }
  }

  notifyVideoCompleted(order: Order) {
    this.notifyDeliveryTeam(order)
  }

  private notifyDeliveryTeam(order: Order) {
    const deliveryStaff = this.staff.filter((s) =>
      ['DELIVERY_MANAGER', 'ORDER_MANAGER', 'SUPER_ADMIN'].includes(s.role) ||
      s.roles?.some((r) => ['DELIVERY_MANAGER', 'ORDER_MANAGER', 'SUPER_ADMIN'].includes(r))
    )
    deliveryStaff.forEach((del) => {
      this.createNotification({
        user_id: del.id,
        title: 'অর্ডার ডেলিভারির জন্য প্রস্তুত!',
        message: `${order.order_number}: ${order.title} এর কাজ সম্পন্ন হয়েছে। ক্লায়েন্ট ডেলিভারি নিশ্চিত করুন।`,
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

    // Automatically mark ready-for-delivery notifications for this order as read
    await this.markOrderNotificationsAsRead(orderId, updated.order_number, '/delivery')

    if (await this.checkLiveSupport()) {
      try {
        const ord = await this.getOrderById(orderId)
        const targetId = isUuid(orderId) ? orderId : ord?.id
        if (targetId && isUuid(targetId)) {
          const safeDeliveredBy = isUuid(payload.delivered_by) ? payload.delivered_by : null
          await supabase.from('deliveries').upsert({
            order_id: targetId,
            delivered_by: safeDeliveredBy,
            delivery_method: payload.delivery_method,
            recipient_name: payload.recipient_name,
            recipient_phone: payload.recipient_phone,
            notes: payload.notes || null,
            confirmation_status: 'DELIVERED',
          })
        }
      } catch (err) {
        console.warn('Supabase markDelivered sync error:', err)
      }
    }

    return updated
  }

  // -------------------------------------------------------------
  // COMMENTS
  // -------------------------------------------------------------
  async getComments(orderId: string): Promise<OrderComment[]> {
    if (await this.checkLiveSupport()) {
      try {
        const ord = await this.getOrderById(orderId)
        const targetId = isUuid(orderId) ? orderId : ord?.id
        if (targetId && isUuid(targetId)) {
          const { data, error } = await supabase
            .from('order_comments')
            .select('*')
            .eq('order_id', targetId)
            .order('created_at', { ascending: true })

          if (!error && data && data.length > 0) {
            const mapped: OrderComment[] = data.map((c: any) => ({
              ...c,
              user: this.staff.find((st) => st.id === c.user_id) || undefined,
            }))
            this.comments[orderId] = mapped
            saveLocal(STORAGE_KEYS.COMMENTS, this.comments)
            return mapped
          }
        }
      } catch (err) {
        console.warn('Supabase getComments error:', err)
      }
    }
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

    if (await this.checkLiveSupport()) {
      try {
        const ord = await this.getOrderById(orderId)
        const targetId = isUuid(orderId) ? orderId : ord?.id
        if (targetId && isUuid(targetId)) {
          const safeUserId = isUuid(userId) ? userId : null
          await supabase.from('order_comments').insert({
            order_id: targetId,
            user_id: safeUserId,
            message,
          })
        }
      } catch (err) {
        console.warn('Supabase addComment failed:', err)
      }
    }

    return newComment
  }

  // -------------------------------------------------------------
  // PAYMENTS & EXPENSES
  // -------------------------------------------------------------
  async getPayments(): Promise<Payment[]> {
    if (await this.checkLiveSupport()) {
      try {
        const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false })
        if (!error && data && data.length > 0) {
          const livePayments: Payment[] = data.map((p: any) => ({
            ...p,
            recorder: this.staff.find((s) => s.id === p.recorded_by) || null,
          }))
          const liveIds = new Set(livePayments.map((p) => p.id))
          const localOnly = this.payments.filter((loc) => !liveIds.has(loc.id))
          const merged = [...livePayments, ...localOnly]
          this.payments = merged
          saveLocal(STORAGE_KEYS.PAYMENTS, this.payments)
          return merged
        }
      } catch (err) {
        console.warn('Supabase getPayments error:', err)
      }
    }
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
    const orderIdx = this.orders.findIndex((o) => o.id === payload.order_id || o.order_number === payload.order_number)
    if (orderIdx !== -1) {
      const order = this.orders[orderIdx]
      const orderTotal = Number(order.total_amount) || 0
      const orderDiscount = Number(order.discount_amount) || 0

      const allOrderPayments = this.payments.filter((p) => p.order_id === order.id || p.order_number === order.order_number)
      const totalPaid = allOrderPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      const due = Math.max(0, orderTotal - orderDiscount - totalPaid)

      order.paid_amount = totalPaid
      order.due_amount = due
      order.payment_status = totalPaid <= 0 ? 'UNPAID' : due <= 0 ? 'PAID' : 'PARTIAL'
      order.updated_at = new Date().toISOString()

      saveLocal(STORAGE_KEYS.ORDERS, this.orders)

      if (await this.checkLiveSupport()) {
        try {
          const targetOrderId = isUuid(order.id) ? order.id : null
          if (targetOrderId) {
            await supabase.from('payments').insert({
              order_id: targetOrderId,
              amount: newPayment.amount,
              payment_method: newPayment.payment_method,
              transaction_reference: newPayment.transaction_reference,
              notes: newPayment.notes,
              recorded_by: isUuid(newPayment.recorded_by) ? newPayment.recorded_by : null,
            })

            await supabase
              .from('orders')
              .update({
                paid_amount: totalPaid,
                due_amount: due,
                payment_status: order.payment_status,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetOrderId)
          }
        } catch (err) {
          console.warn('Could not sync payment to Supabase:', err)
        }
      }
    }

    return newPayment
  }

  async getExpenses(): Promise<Expense[]> {
    if (await this.checkLiveSupport()) {
      try {
        const { data, error } = await supabase.from('expenses').select('*, category:expense_categories(*)').order('expense_date', { ascending: false })
        if (!error && data && data.length > 0) {
          const liveExpenses: Expense[] = data.map((e: any) => ({
            ...e,
            category: e.category || this.expenseCategories.find((c) => c.id === e.category_id) || null,
            recorder: this.staff.find((s) => s.id === e.recorded_by) || null,
          }))
          const liveIds = new Set(liveExpenses.map((e) => e.id))
          const localOnly = this.expenses.filter((loc) => !liveIds.has(loc.id))
          const merged = [...liveExpenses, ...localOnly]
          this.expenses = merged
          saveLocal(STORAGE_KEYS.EXPENSES, this.expenses)
          return merged
        }
      } catch (err) {
        console.warn('Supabase getExpenses error:', err)
      }
    }
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
      expense_date: payload.expense_date || getLocalDateString(new Date()),
      payment_method: payload.payment_method,
      reference_no: payload.reference_no || null,
      notes: payload.notes || null,
      recorded_by: payload.recorded_by || null,
      recorder: this.staff.find((s) => s.id === payload.recorded_by),
      created_at: new Date().toISOString(),
    }

    this.expenses.unshift(newExpense)
    saveLocal(STORAGE_KEYS.EXPENSES, this.expenses)

    if (await this.checkLiveSupport()) {
      try {
        await supabase.from('expenses').insert({
          category_id: isUuid(payload.category_id) ? payload.category_id : null,
          title: payload.title,
          amount: newExpense.amount,
          expense_date: newExpense.expense_date,
          payment_method: newExpense.payment_method,
          reference_no: newExpense.reference_no,
          notes: newExpense.notes,
          recorded_by: isUuid(payload.recorded_by) ? payload.recorded_by : null,
        })
      } catch (err) {
        console.warn('Supabase recordExpense failed:', err)
      }
    }

    return newExpense
  }

  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    if (await this.checkLiveSupport()) {
      try {
        const { data, error } = await supabase.from('expense_categories').select('*').order('name_bn', { ascending: true })
        if (!error && data && data.length > 0) {
          this.expenseCategories = data as ExpenseCategory[]
          saveLocal(STORAGE_KEYS.EXPENSE_CATEGORIES, this.expenseCategories)
          return this.expenseCategories
        }
      } catch (err) {
        console.warn('Supabase getExpenseCategories error:', err)
      }
    }
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

    if (await this.checkLiveSupport()) {
      try {
        const { data } = await supabase.from('expense_categories').insert({ name, name_bn }).select().maybeSingle()
        if (data) newCat.id = data.id
      } catch {}
    }

    return newCat
  }

  // -------------------------------------------------------------
  // DASHBOARD METRICS (ALWAYS FRESH FROM CLOUD & LOCAL MERGE)
  // -------------------------------------------------------------
  async getDashboardStats() {
    const orders = await this.getOrders()
    const payments = await this.getPayments()
    const expenses = await this.getExpenses()

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

    const todayStr = getLocalDateString(new Date())
    const todayOrders = orders.filter((o) => o.created_at && getLocalDateString(o.created_at) === todayStr)

    const totalReceivedPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const totalOutstandingBalances = orders.reduce((sum, o) => sum + Number(o.due_amount || 0), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
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
  private emitNotificationsUpdated(): void {
    try {
      window.dispatchEvent(new CustomEvent('hitune:notifications-updated'))
    } catch {}
  }

  /** Marks unread notifications tied to a given order (and optional route prefix) as read. */
  private async markOrderNotificationsAsRead(
    orderId: string,
    orderNumber?: string,
    linkPrefix?: string
  ): Promise<void> {
    const todayStr = getLocalDateString(new Date())
    const readDayMap = loadLocal<Record<string, string>>(STORAGE_KEYS.NOTIF_READ_DAY, {})
    const matchedUuids: string[] = []
    let changed = false

    this.notifications.forEach((n) => {
      if (n.is_read) return
      const matchesLink = Boolean(n.link && n.link.includes(orderId) && (!linkPrefix || n.link.startsWith(linkPrefix)))
      const matchesOrderNum = Boolean(orderNumber && n.message?.includes(orderNumber) && (!linkPrefix || (n.link || '').startsWith(linkPrefix)))
      if (matchesLink || matchesOrderNum) {
        n.is_read = true
        readDayMap[n.id] = todayStr
        if (isUuid(n.id)) matchedUuids.push(n.id)
        changed = true
      }
    })

    if (changed) {
      saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications)
      saveLocal(STORAGE_KEYS.NOTIF_READ_DAY, readDayMap)
      this.emitNotificationsUpdated()
    }

    if (await this.checkLiveSupport()) {
      try {
        if (matchedUuids.length > 0) {
          await supabase.from('notifications').update({ is_read: true }).in('id', matchedUuids)
        } else if (isUuid(orderId)) {
          const linkPattern = linkPrefix ? `${linkPrefix}?orderId=${orderId}` : `%${orderId}%`
          const query = supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
          if (linkPrefix) {
            await query.eq('link', linkPattern)
          } else {
            await query.ilike('link', linkPattern)
          }
        }
      } catch (err) {
        console.warn('Supabase markOrderNotificationsAsRead failed:', err)
      }
    }
  }

  private cleanupExpiredNotifications(list: NotificationItem[]): {
    cleaned: NotificationItem[]
    expiredUuids: string[]
  } {
    const todayStr = getLocalDateString(new Date())
    const readDayMap = loadLocal<Record<string, string>>(STORAGE_KEYS.NOTIF_READ_DAY, {})
    const dismissedSet = new Set(loadLocal<string[]>(STORAGE_KEYS.NOTIF_DISMISSED, []))
    const expiredUuids: string[] = []
    let readMapChanged = false
    let dismissedChanged = false

    // Also deduplicate notifications (in case a temporary local ID and cloud UUID share the same content)
    const seenKeys = new Set<string>()

    const cleaned = list.filter((n) => {
      if (dismissedSet.has(n.id)) return false

      const dedupKey = `${n.user_id || ''}|${n.title}|${n.message}`
      if (seenKeys.has(dedupKey)) return false
      seenKeys.add(dedupKey)

      if (n.is_read) {
        const effectiveReadDate = readDayMap[n.id] || getLocalDateString(n.created_at)
        // Purge read notifications from previous days (past midnight 12:00 AM)
        if (effectiveReadDate < todayStr) {
          dismissedSet.add(n.id)
          dismissedChanged = true
          if (isUuid(n.id)) expiredUuids.push(n.id)
          if (readDayMap[n.id]) {
            delete readDayMap[n.id]
            readMapChanged = true
          }
          return false
        }
      }
      // Keep ALL unread notifications regardless of date!
      return true
    })

    if (readMapChanged) saveLocal(STORAGE_KEYS.NOTIF_READ_DAY, readDayMap)
    if (dismissedChanged) {
      // Keep dismissed list bounded to last 500 IDs
      const bounded = Array.from(dismissedSet).slice(-500)
      saveLocal(STORAGE_KEYS.NOTIF_DISMISSED, bounded)
    }

    return { cleaned, expiredUuids }
  }

  async getNotifications(userId?: string, userRole?: UserRole): Promise<NotificationItem[]> {
    let merged: NotificationItem[] = [...this.notifications]

    if (await this.checkLiveSupport()) {
      try {
        let q = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)
        if (userId && isUuid(userId)) {
          // user_id is a UUID column in Supabase; querying 'all' causes PostgreSQL error 22P02
          q = q.eq('user_id', userId)
        }
        const { data, error } = await q
        if (!error && data) {
          const liveList = data as NotificationItem[]
          const liveIds = new Set(liveList.map((n) => n.id))
          const liveSignatures = new Set(liveList.map((n) => `${n.user_id}|${n.title}|${n.message}`))
          const canTrustExhaustiveLive = liveList.length < 50
          const localOnly = this.notifications.filter((n) => {
            if (liveIds.has(n.id) || liveSignatures.has(`${n.user_id}|${n.title}|${n.message}`)) {
              return false
            }
            // If Supabase returned fewer than the 50-row cap cleanly, drop stale cloud UUIDs deleted on other devices
            if (canTrustExhaustiveLive && isUuid(n.id) && (!userId || n.user_id === userId)) {
              return false
            }
            return true
          })
          merged = [...liveList, ...localOnly]
        } else if (error) {
          console.warn('Supabase getNotifications query warning:', error.message)
        }
      } catch (err) {
        console.warn('Supabase getNotifications error:', err)
      }
    }

    // Apply midnight cleanup for previous days' read notifications (keep unread ones!)
    const { cleaned, expiredUuids } = this.cleanupExpiredNotifications(merged)
    this.notifications = cleaned
    saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications)

    if (expiredUuids.length > 0 && await this.checkLiveSupport()) {
      Promise.resolve(supabase.from('notifications').delete().in('id', expiredUuids)).catch(() => {})
    }

    // Role-specific filtering
    return cleaned.filter((n) => {
      // 1. User check (if item is tagged for a specific user, ensure match)
      if (userId && n.user_id && n.user_id !== 'all' && n.user_id !== userId) {
        return false
      }

      const link = (n.link || '').toLowerCase()
      const title = n.title || ''
      const message = n.message || ''

      // 2. Strict Role Segregation
      if (userRole === 'AUDIO_DESIGNER') {
        const isAudio =
          link.includes('/audio') ||
          title.includes('অডিও') ||
          message.includes('অডিও') ||
          title.includes('সাউন্ড') ||
          message.includes('সাউন্ড')

        const isVideoOnlyOrDelivery =
          link.includes('/video') ||
          title.includes('ভিডিও') ||
          message.includes('ভিডিও এডিটিং') ||
          link.includes('/delivery') ||
          title.includes('ডেলিভারি') ||
          message.includes('ডেলিভারি')

        return isAudio && !isVideoOnlyOrDelivery
      }

      if (userRole === 'VIDEO_EDITOR') {
        const isVideo =
          link.includes('/video') ||
          title.includes('ভিডিও') ||
          message.includes('ভিডিও')

        const isAudioOnlyOrDelivery =
          (link.includes('/audio') || link.includes('/delivery') || title.includes('ডেলিভারি')) &&
          !title.includes('ভিডিও') &&
          !message.includes('ভিডিও')

        return isVideo && !isAudioOnlyOrDelivery
      }

      if (userRole === 'DELIVERY_MANAGER') {
        return (
          link.includes('/delivery') ||
          title.includes('ডেলিভারি') ||
          message.includes('ডেলিভারি')
        )
      }

      // SUPER_ADMIN and other management roles can view all notifications
      return true
    })
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const todayStr = getLocalDateString(new Date())
    const readDayMap = loadLocal<Record<string, string>>(STORAGE_KEYS.NOTIF_READ_DAY, {})
    const notif = this.notifications.find((n) => n.id === id)
    const targetIds: string[] = [id]

    if (notif) {
      notif.is_read = true
      readDayMap[notif.id] = todayStr
      // Also mark any identical duplicate
      this.notifications.forEach((other) => {
        if (other.id !== notif.id && other.user_id === notif.user_id && other.title === notif.title && other.message === notif.message) {
          other.is_read = true
          readDayMap[other.id] = todayStr
          targetIds.push(other.id)
        }
      })
      saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications)
      saveLocal(STORAGE_KEYS.NOTIF_READ_DAY, readDayMap)
      this.emitNotificationsUpdated()
    }

    if (await this.checkLiveSupport()) {
      const uuidTargets = targetIds.filter((tid) => isUuid(tid))
      if (uuidTargets.length > 0) {
        try {
          await supabase.from('notifications').update({ is_read: true }).in('id', uuidTargets)
        } catch (e) {
          console.warn('Supabase markNotificationAsRead failed:', e)
        }
      }
    }
  }

  async markNotificationAsUnread(id: string): Promise<void> {
    const readDayMap = loadLocal<Record<string, string>>(STORAGE_KEYS.NOTIF_READ_DAY, {})
    const notif = this.notifications.find((n) => n.id === id)
    if (notif) {
      notif.is_read = false
      delete readDayMap[notif.id]
      saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications)
      saveLocal(STORAGE_KEYS.NOTIF_READ_DAY, readDayMap)
      this.emitNotificationsUpdated()
    }

    if (await this.checkLiveSupport() && isUuid(id)) {
      try {
        await supabase.from('notifications').update({ is_read: false }).eq('id', id)
      } catch (e) {
        console.warn('Supabase markNotificationAsUnread failed:', e)
      }
    }
  }

  async deleteNotification(id: string): Promise<void> {
    this.notifications = this.notifications.filter((n) => n.id !== id)
    saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications)

    const dismissed = new Set(loadLocal<string[]>(STORAGE_KEYS.NOTIF_DISMISSED, []))
    dismissed.add(id)
    saveLocal(STORAGE_KEYS.NOTIF_DISMISSED, Array.from(dismissed).slice(-500))
    this.emitNotificationsUpdated()

    if (await this.checkLiveSupport() && isUuid(id)) {
      try {
        await supabase.from('notifications').delete().eq('id', id)
      } catch (e) {
        console.warn('Supabase deleteNotification failed:', e)
      }
    }
  }

  async clearReadNotifications(userId: string): Promise<void> {
    const toRemoveIds: string[] = []
    this.notifications = this.notifications.filter((n) => {
      const belongsToUser = !n.user_id || n.user_id === 'all' || n.user_id === userId
      if (belongsToUser && n.is_read) {
        toRemoveIds.push(n.id)
        return false
      }
      return true
    })
    saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications)
    this.emitNotificationsUpdated()

    if (toRemoveIds.length > 0) {
      const dismissed = new Set(loadLocal<string[]>(STORAGE_KEYS.NOTIF_DISMISSED, []))
      toRemoveIds.forEach((id) => dismissed.add(id))
      saveLocal(STORAGE_KEYS.NOTIF_DISMISSED, Array.from(dismissed).slice(-500))

      const uuidTargets = toRemoveIds.filter((id) => isUuid(id))
      if (uuidTargets.length > 0 && await this.checkLiveSupport()) {
        try {
          await supabase.from('notifications').delete().in('id', uuidTargets)
        } catch (e) {
          console.warn('Supabase clearReadNotifications failed:', e)
        }
      }
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const todayStr = getLocalDateString(new Date())
    const readDayMap = loadLocal<Record<string, string>>(STORAGE_KEYS.NOTIF_READ_DAY, {})
    this.notifications.forEach((n) => {
      if (n.user_id === userId || n.user_id === 'all') {
        n.is_read = true
        readDayMap[n.id] = todayStr
      }
    })
    saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications)
    saveLocal(STORAGE_KEYS.NOTIF_READ_DAY, readDayMap)
    this.emitNotificationsUpdated()

    if (await this.checkLiveSupport() && isUuid(userId)) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
      } catch (e) {
        console.warn('Supabase markAllNotificationsAsRead failed:', e)
      }
    }
  }

  createNotification(item: Omit<NotificationItem, 'id' | 'is_read' | 'created_at'>): NotificationItem {
    // Prevent duplicate creation for the exact same unread alert within 10 minutes
    const existing = this.notifications.find(
      (n) =>
        !n.is_read &&
        n.user_id === item.user_id &&
        n.title === item.title &&
        n.message === item.message &&
        Date.now() - new Date(n.created_at).getTime() < 10 * 60 * 1000
    )
    if (existing) return existing

    const tempId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    const notif: NotificationItem = {
      ...item,
      id: tempId,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    this.notifications.unshift(notif)
    saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications)
    this.emitNotificationsUpdated()

    if (isSupabaseConfigured && isUuid(item.user_id)) {
      Promise.resolve(
        supabase
          .from('notifications')
          .insert({
            user_id: item.user_id,
            title: item.title,
            message: item.message,
            link: item.link || null,
            type: item.type || 'INFO',
            is_read: false,
          })
          .select()
          .maybeSingle()
      )
        .then(({ data, error }: any) => {
          if (error) {
            console.warn('Supabase createNotification notice:', error.message)
          } else if (data?.id) {
            // Sync local ID with real Supabase UUID so no duplicate entries appear later
            const target = this.notifications.find((n) => n.id === tempId)
            if (target) {
              target.id = data.id
              target.created_at = data.created_at || target.created_at
              saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications)
            }
          }
        })
        .catch(() => {})
    }

    return notif
  }

  // -------------------------------------------------------------
  // STAFF & CATEGORIES
  // -------------------------------------------------------------
  async getStaff(): Promise<Profile[]> {
    if (await this.checkLiveSupport()) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
        if (!error && data && data.length > 0) {
          const liveStaff = data as Profile[]
          const liveIds = new Set(liveStaff.map((s) => s.id))
          const localOnly = this.staff.filter((s) => !liveIds.has(s.id))
          const merged = [...liveStaff, ...localOnly]
          this.staff = merged
          saveLocal(STORAGE_KEYS.STAFF, this.staff)
          return merged
        }
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
    if (await this.checkLiveSupport()) {
      try {
        const { data, error } = await supabase
          .from('order_categories')
          .select('*')
          .order('sort_order', { ascending: true })

        if (!error && data && data.length > 0) {
          this.categories = data as OrderCategory[]
          saveLocal(STORAGE_KEYS.CATEGORIES, this.categories)
          return this.categories
        }
      } catch (err) {
        console.warn('Supabase getCategories error:', err)
      }
    }
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

    if (await this.checkLiveSupport()) {
      try {
        const { data, error } = await supabase
          .from('order_categories')
          .insert({
            name: payload.name,
            name_bn: payload.name_bn,
            slug: payload.slug,
            dynamic_form_type: payload.dynamic_form_type || 'GENERAL',
            sort_order: newCat.sort_order,
          })
          .select()
          .single()

        if (!error && data) {
          newCat.id = data.id
        }
      } catch (err) {
        console.warn('Supabase createCategory error:', err)
      }
    }

    this.categories.push(newCat)
    saveLocal(STORAGE_KEYS.CATEGORIES, this.categories)
    return newCat
  }
}

export const dataService = new DataService()
