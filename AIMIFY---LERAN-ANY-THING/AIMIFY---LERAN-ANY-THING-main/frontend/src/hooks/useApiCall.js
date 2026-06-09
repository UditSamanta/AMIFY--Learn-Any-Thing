import { useState, useRef } from 'react'

export function useApiCall() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const inFlightRef = useRef(false)

  const call = async (fn) => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    setError(null)
    try {
      const result = await fn()
      return result
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Something went wrong')
      throw e
    } finally {
      setLoading(false)
      inFlightRef.current = false
    }
  }

  return { loading, error, call }
}
