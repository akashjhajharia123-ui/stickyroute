import { useEffect, useState } from 'react'

/**
 * Loads a JSON file served next to the page (public/), e.g. "data/routing-proof.json".
 * @returns {{data: unknown, error: string | null}}
 */
export function useJson(path) {
  const [state, setState] = useState({ data: null, error: null })
  useEffect(() => {
    let cancelled = false
    fetch(path, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
        return res.json()
      })
      .then(data => { if (!cancelled) setState({ data, error: null }) })
      .catch(err => { if (!cancelled) setState({ data: null, error: err instanceof Error ? err.message : 'unknown error' }) })
    return () => { cancelled = true }
  }, [path])
  return state
}
