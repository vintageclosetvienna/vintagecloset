import { useCallback, useEffect, useState } from 'react'

export function useClipboardFeedback(timeout = 1500) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copy = useCallback(async (id: string, value: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(value)
      } else {
        const area = document.createElement('textarea')
        area.value = value
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.focus()
        area.select()
        document.execCommand('copy')
        document.body.removeChild(area)
      }
      setCopiedId(id)
    } catch (error) {
      console.error('Failed to copy contact info', error)
    }
  }, [])

  useEffect(() => {
    if (!copiedId) return
    const timer = window.setTimeout(() => setCopiedId(null), timeout)
    return () => window.clearTimeout(timer)
  }, [copiedId, timeout])

  return { copiedId, copy }
}


