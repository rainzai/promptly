// Calls to the FastAPI backend. In development Vite proxies /api to it (see vite.config.js).

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// FastAPI errors are {detail: "..."}, or {detail: [{msg}, ...]} for invalid input.
function errorMessage(status, data) {
  // 502 means the AI behind the backend failed; its detail is too technical to show.
  if (status === 502) return "The AI couldn't finish that just now. Please try again."
  const detail = data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join('. ')
  if (status >= 500) return "The Promptly server isn't responding. Try again in a moment."
  return `Something went wrong (error ${status}).`
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`/api${path}`, options)
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Could not reach the Promptly server. Check your connection and try again.', 0)
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(errorMessage(response.status, data), response.status)
  return data
}

const post = (body, signal) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
  signal,
})

const id = encodeURIComponent

/** Upload lecture slides (PDF); returns the lecture with its prerequisites. */
export function uploadLecture(file, signal) {
  const body = new FormData()
  body.append('file', file)
  return request('/lectures', { method: 'POST', body, signal })
}

export const getLecture = (lectureId) => request(`/lectures/${id(lectureId)}`)

/** Generate a levelled quiz on one of the lecture's prerequisites. */
export const createQuiz = (lectureId, user, prerequisite, signal) =>
  request(`/lectures/${id(lectureId)}/quizzes`, post({ user, prerequisite }, signal))

export const getQuiz = (quizId) => request(`/quizzes/${id(quizId)}`)

export const answerQuestion = (quizId, questionId, answer) =>
  request(`/quizzes/${id(quizId)}/questions/${questionId}/answer`, post({ answer }))

export const getProgress = (user) => request(`/progress/${id(user)}`)
