import { useEffect, useState } from 'react'

// There are no accounts yet: the student's name is remembered in this browser,
// and points, expertise and help requests are saved under it on the server.

const KEY = 'promptly.name'
const CHANGED = 'promptly:name'

export function savedName() {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveName(name) {
  try {
    if (name) localStorage.setItem(KEY, name)
    else localStorage.removeItem(KEY)
  } catch {
    // Private mode: the name just won't be remembered.
  }
  window.dispatchEvent(new Event(CHANGED))
}

/** The student's name, kept in sync across components and tabs. */
export function useUserName() {
  const [name, setName] = useState(savedName)

  useEffect(() => {
    const sync = () => setName(savedName())
    window.addEventListener(CHANGED, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CHANGED, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return [name, saveName]
}
