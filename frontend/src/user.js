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

// The last lecture the student uploaded: Play builds its challenges from those slides.

const LECTURE_KEY = 'promptly.lecture'

/** {id, title} of the last uploaded lecture, or null. */
export function savedLecture() {
  try {
    return JSON.parse(localStorage.getItem(LECTURE_KEY)) ?? null
  } catch {
    return null
  }
}

export function saveLecture(lecture) {
  try {
    if (lecture) localStorage.setItem(LECTURE_KEY, JSON.stringify({ id: lecture.lecture_id, title: lecture.title }))
    else localStorage.removeItem(LECTURE_KEY)
  } catch {
    // Private mode: Play will ask for the slides again.
  }
}
