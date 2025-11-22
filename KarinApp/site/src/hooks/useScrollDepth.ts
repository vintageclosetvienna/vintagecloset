import { useEffect, useState } from 'react'

export function useScrollDepth(threshold = 0.6) {
  const [reached, setReached] = useState(false)

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.body.scrollHeight - window.innerHeight
      if (docHeight <= 0) {
        setReached(false)
        return
      }
      setReached(scrollTop / docHeight >= threshold)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [threshold])

  return reached
}


