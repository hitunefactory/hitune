/**
 * Mobile hardware/gesture Back Button manager for HI TUNE STUDIO.
 *
 * Provides native mobile app back-button behavior:
 * 1. LIFO overlay stack: Back closes the topmost modal, drawer, dropdown, or search popup.
 * 2. Deep-link fallback: If opened directly on a non-home page (idx === 0), Back returns to `/` instead of closing the app.
 * 3. Root exit guard: On `/` at stack bottom on mobile/PWA, first Back press shows an exit warning toast;
 *    pressing Back again within 2.4 seconds exits normally.
 */

interface OverlayEntry {
  id: string
  openUrl: string
  onClose: () => void
}

interface PendingCleanup {
  id: string
  openUrl: string
  timerId: number
}

interface HistoryStateShape {
  idx?: number
  usr?: unknown
  key?: string
  __hituneOverlay?: string
  __hituneRootBase?: boolean
  __hituneRootGuard?: boolean
  __hituneDeepRootBase?: boolean
  __hituneDeepEntry?: boolean
  [key: string]: unknown
}

const overlayStack: OverlayEntry[] = []
const closedByPopIds = new Set<string>()
let pendingCleanup: PendingCleanup | null = null
let ignoreSelfPopCount = 0
let overlaySeq = 0
let listenerAttached = false

// Mobile navigation guard callbacks & state
let currentPathname = '/'
let exitWindowUntil = 0
let onShowExitToast: (() => void) | null = null
let onNavigateHome: (() => void) | null = null

const getCurrentUrl = (): string =>
  window.location.pathname + window.location.search + window.location.hash

const getHistoryState = (): HistoryStateShape =>
  (window.history.state as HistoryStateShape | null) || {}

const isMobileOrStandalone = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    return (
      window.matchMedia('(max-width: 1023px)').matches ||
      window.matchMedia('(display-mode: standalone)').matches
    )
  } catch {
    return false
  }
}

const handleCapturePopState = (event: PopStateEvent): void => {
  if (ignoreSelfPopCount > 0) {
    ignoreSelfPopCount--
    event.stopImmediatePropagation()
    return
  }

  const state = getHistoryState()

  // 1. Dismiss topmost UI overlay (drawer, dropdown, modal) first
  if (overlayStack.length > 0) {
    const top = overlayStack[overlayStack.length - 1]
    if (state.__hituneOverlay !== top.id) {
      overlayStack.pop()
      closedByPopIds.add(top.id)
      event.stopImmediatePropagation()
      top.onClose()
      return
    }
  }

  // 2. Deep-link fallback: opened directly on sub-page with no prior app history -> navigate to `/`
  if (state.__hituneDeepRootBase && currentPathname !== '/' && onNavigateHome) {
    event.stopImmediatePropagation()
    onNavigateHome()
    return
  }

  // 3. Root exit guard on Dashboard (`/`) -> show "press back again to exit" toast on first press
  if (state.__hituneRootBase && currentPathname === '/') {
    event.stopImmediatePropagation()
    exitWindowUntil = Date.now() + 2400
    onShowExitToast?.()
    return
  }
}

const ensurePopListener = (): void => {
  if (typeof window === 'undefined' || listenerAttached) return
  window.addEventListener('popstate', handleCapturePopState, true)
  listenerAttached = true
}

/**
 * Registers an open modal/drawer/menu onto the mobile back stack.
 * Returns an unregister function to call when the overlay closes or unmounts.
 */
export const registerBackOverlay = (onClose: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {}
  ensurePopListener()

  const id = `ov-${++overlaySeq}`
  const openUrl = getCurrentUrl()
  const baseState = getHistoryState()

  // If another overlay closed in the same synchronous commit (e.g., dropdown -> modal, or StrictMode remount),
  // cancel its back cleanup and reuse its history slot cleanly instead of creating an orphan entry.
  if (
    pendingCleanup &&
    baseState.__hituneOverlay === pendingCleanup.id &&
    pendingCleanup.openUrl === openUrl
  ) {
    window.clearTimeout(pendingCleanup.timerId)
    pendingCleanup = null
    window.history.replaceState({ ...baseState, __hituneOverlay: id }, '', window.location.href)
  } else {
    window.history.pushState({ ...baseState, __hituneOverlay: id }, '', window.location.href)
  }

  overlayStack.push({ id, openUrl, onClose })

  return () => {
    const idx = overlayStack.findIndex((entry) => entry.id === id)
    if (idx !== -1) {
      overlayStack.splice(idx, 1)
    }

    if (closedByPopIds.delete(id)) {
      return
    }

    // Defer back() by one short macrotask so simultaneous React Router navigate() calls finish first
    const timerId = window.setTimeout(() => {
      if (pendingCleanup?.id === id) {
        pendingCleanup = null
      }
      const currentState = getHistoryState()
      if (currentState.__hituneOverlay === id && getCurrentUrl() === openUrl) {
        ignoreSelfPopCount++
        window.history.back()
      }
    }, 25)

    pendingCleanup = { id, openUrl, timerId }
  }
}

/**
 * Keeps the global navigation controller synced with current route and callbacks,
 * and arms root-exit / deep-link back guards upon user interaction on mobile/PWA.
 */
export const configureMobileNavigation = (
  pathname: string,
  callbacks: {
    showExitToast: () => void
    navigateHome: () => void
  }
): void => {
  currentPathname = pathname
  onShowExitToast = callbacks.showExitToast
  onNavigateHome = callbacks.navigateHome
  ensurePopListener()
}

export const armMobileBackGuardIfNeeded = (): void => {
  if (typeof window === 'undefined') return
  if (!isMobileOrStandalone()) return
  if (overlayStack.length > 0) return

  const state = getHistoryState()
  if (state.__hituneOverlay) return

  const routerIdx = typeof state.idx === 'number' ? state.idx : 0

  // Sub-page opened directly with no in-app previous page -> arm Home fallback behind it
  if (currentPathname !== '/' && routerIdx === 0) {
    if (!state.__hituneDeepRootBase && !state.__hituneDeepEntry) {
      window.history.replaceState({ ...state, __hituneDeepRootBase: true }, '', window.location.href)
      window.history.pushState(
        { ...state, __hituneDeepRootBase: undefined, __hituneDeepEntry: true },
        '',
        window.location.href
      )
    }
    return
  }

  // Home route (`/`) at bottom of history -> arm double-back exit guard once outside toast window
  if (currentPathname === '/' && routerIdx === 0) {
    if (Date.now() < exitWindowUntil) return
    if (!state.__hituneRootGuard) {
      const cleanBase = { ...state, __hituneRootGuard: undefined, __hituneRootBase: true }
      window.history.replaceState(cleanBase, '', window.location.href)
      window.history.pushState(
        { ...state, __hituneRootBase: undefined, __hituneRootGuard: true },
        '',
        window.location.href
      )
    }
  }
}
