import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((fn) => fn())
}

/**
 * Registers global PWA lifecycle listeners immediately on module load
 * so early `beforeinstallprompt` events are never missed before components mount.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredInstallPrompt = e as BeforeInstallPromptEvent
    notifyListeners()
  })

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    notifyListeners()
  })
}

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as any).standalone)
  )
}

function checkIsIos(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
}

export function usePwaInstall() {
  const [canPrompt, setCanPrompt] = useState<boolean>(() => Boolean(deferredInstallPrompt))
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkIsStandalone())
  const [showIosGuide, setShowIosGuide] = useState(false)
  const isIos = checkIsIos()

  useEffect(() => {
    const syncState = () => {
      setCanPrompt(Boolean(deferredInstallPrompt))
      setIsInstalled(checkIsStandalone())
    }

    listeners.add(syncState)
    const mq = window.matchMedia('(display-mode: standalone)')
    mq.addEventListener?.('change', syncState)

    return () => {
      listeners.delete(syncState)
      mq.removeEventListener?.('change', syncState)
    }
  }, [])

  const triggerInstall = useCallback(async () => {
    if (deferredInstallPrompt) {
      await deferredInstallPrompt.prompt()
      const choice = await deferredInstallPrompt.userChoice.catch(() => null)
      if (choice?.outcome === 'accepted') {
        deferredInstallPrompt = null
        setCanPrompt(false)
        setIsInstalled(true)
      }
      return
    }

    if (isIos && !checkIsStandalone()) {
      setShowIosGuide(true)
    }
  }, [isIos])

  return {
    canInstall: !isInstalled && (canPrompt || isIos),
    isInstalled,
    isIos,
    showIosGuide,
    setShowIosGuide,
    triggerInstall,
  }
}
