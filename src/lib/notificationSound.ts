import { NotificationItem } from '../types/database'

const SOUND_PREF_KEY = 'hitune_notif_sound_enabled_v1'

let sharedAudioCtx: AudioContext | null = null
let lastChimeTimestamp = 0
let unlockListenersAttached = false

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return null
    sharedAudioCtx = new AudioCtx()
  }
  return sharedAudioCtx
}

function attachAudioUnlockListeners() {
  if (typeof window === 'undefined' || unlockListenersAttached) return
  unlockListenersAttached = true

  const unlock = () => {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    if (ctx && ctx.state === 'running') {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }

  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('keydown', unlock, { passive: true })
  window.addEventListener('touchstart', unlock, { passive: true })
}

attachAudioUnlockListeners()

export function isNotificationSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(SOUND_PREF_KEY)
    return val === null ? true : val === '1'
  } catch {
    return true
  }
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_PREF_KEY, enabled ? '1' : '0')
  } catch {}
}

/**
 * Plays a pleasant multi-note studio chime via Web Audio API.
 * Uses zero external MP3 assets so it works reliably offline and in installed PWAs.
 */
export async function playNotificationChime(options?: {
  force?: boolean
  vibrate?: boolean
}): Promise<boolean> {
  const force = Boolean(options?.force)
  if (!force && !isNotificationSoundEnabled()) return false

  const nowMs = Date.now()
  if (!force && nowMs - lastChimeTimestamp < 1200) {
    return false
  }
  lastChimeTimestamp = nowMs

  if (options?.vibrate !== false && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate([160, 70, 160])
    } catch {}
  }

  const ctx = getAudioContext()
  if (!ctx) return false

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    if (ctx.state !== 'running') {
      return false
    }

    const startTime = ctx.currentTime + 0.01
    // Pleasant bright studio chime: E5 -> A5 -> D6
    const notes = [
      { freq: 659.25, delay: 0, duration: 0.22, gain: 0.16 },
      { freq: 880.0, delay: 0.11, duration: 0.24, gain: 0.18 },
      { freq: 1174.66, delay: 0.23, duration: 0.36, gain: 0.14 },
    ]

    notes.forEach((n) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(n.freq, startTime + n.delay)

      gainNode.gain.setValueAtTime(0.0001, startTime + n.delay)
      gainNode.gain.linearRampToValueAtTime(n.gain, startTime + n.delay + 0.018)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + n.delay + n.duration)

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.start(startTime + n.delay)
      osc.stop(startTime + n.delay + n.duration + 0.02)
    })

    return true
  } catch {
    return false
  }
}

export type BrowserNotificationPermission = NotificationPermission | 'unsupported'

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported'
  }
  return Notification.permission
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported'
  }
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/**
 * Triggers a native desktop/mobile OS notification (with system sound/vibration)
 * when browser notification permission is granted.
 */
export async function showNativeNotification(
  notif: Pick<NotificationItem, 'id' | 'title' | 'message' | 'link'>,
  options?: { force?: boolean }
): Promise<void> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  const isWindowFocused = typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus()
  if (!options?.force && isWindowFocused) {
    // User is already looking at the app; in-app chime + badge handle the alert cleanly
    return
  }

  const notifOptions: NotificationOptions & { vibrate?: number[] } = {
    body: notif.message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: notif.id,
    data: { url: notif.link || '/' },
    vibrate: [180, 70, 180],
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(notif.title, notifOptions)
        return
      }
    }
    const nativeNotif = new Notification(notif.title, notifOptions)
    nativeNotif.onclick = () => {
      window.focus()
      if (notif.link) {
        window.dispatchEvent(new CustomEvent('hitune:navigate', { detail: { url: notif.link } }))
      }
      nativeNotif.close()
    }
  } catch {
    // Silently ignore if platform restricts Notification constructor directly (e.g., Android Chrome without SW)
  }
}
