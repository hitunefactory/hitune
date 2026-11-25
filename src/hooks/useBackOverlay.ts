import { useEffect, useRef } from 'react'
import { registerBackOverlay } from '../lib/mobileBack'

/**
 * Hook that ties an open UI overlay (modal, sidebar drawer, dropdown, search bar)
 * to the browser/mobile hardware Back button so pressing Back dismisses it cleanly.
 */
export const useBackOverlay = (isOpen: boolean, onClose: () => void): void => {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    return registerBackOverlay(() => onCloseRef.current())
  }, [isOpen])
}
