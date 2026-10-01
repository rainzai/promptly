import { useEffect, useState } from 'react'

const read = (key) => new URLSearchParams(window.location.search).get(key)

/**
 * One query parameter as state, e.g. /play?challenge=…, so a reload or the
 * back button returns to the same place. Setting it adds a history entry.
 */
export function useSearchParam(key) {
  const [value, setValue] = useState(() => read(key))

  useEffect(() => {
    const onPopState = () => setValue(read(key))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [key])

  const set = (next) => {
    const params = new URLSearchParams(window.location.search)
    if (next) params.set(key, next)
    else params.delete(key)
    const query = params.toString()
    window.history.pushState(null, '', query ? `?${query}` : window.location.pathname)
    setValue(next || null)
    window.scrollTo(0, 0)
  }

  return [value, set]
}
