import { useEffect, useRef, useState } from 'react'
import { uploadLecture } from '../../api.js'
import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import Mascot from '../Mascot.jsx'
import Working from '../Working.jsx'
import { Alert, Eyebrow, Lead, Title } from '../ui.jsx'

const HOW_IT_WORKS = [
  { icon: 'upload', title: 'Upload your slides', text: 'Any lecture, as a PDF.' },
  { icon: 'nodes', title: 'Pick a prerequisite', text: 'One of the topics the lecture builds on.' },
  { icon: 'trophy', title: 'Level up', text: 'Five levels of questions, from recall to challenge.' },
]

const READING = [
  'Uploading your slides…',
  'Reading every slide…',
  'Working out what the lecture builds on…',
  'Picking out the prerequisites…',
]

const MAX_MB = 20 // MAX_UPLOAD_MB on the backend

const isPdf = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name)

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadStep({ onLecture }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [upload, setUpload] = useState(null) // AbortController while uploading
  const inputRef = useRef(null)

  const choose = (picked) => {
    if (!picked) return
    if (!isPdf(picked)) {
      setError(`“${picked.name}” isn't a PDF. Export your slides as a PDF and try again.`)
      return
    }
    if (picked.size > MAX_MB * 1024 * 1024) {
      setError(`“${picked.name}” is over ${MAX_MB} MB. Export it without videos or large images.`)
      return
    }
    setError(null)
    setFile(picked)
  }

  // A file dropped anywhere on the page counts, so a near miss doesn't open the PDF in the browser.
  useEffect(() => {
    let depth = 0
    const hasFiles = (e) => e.dataTransfer?.types.includes('Files')
    const onEnter = (e) => {
      if (!hasFiles(e)) return
      depth += 1
      setDragging(true)
    }
    const onLeave = (e) => {
      if (!hasFiles(e)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    const onOver = (e) => hasFiles(e) && e.preventDefault()
    const onDrop = (e) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth = 0
      setDragging(false)
      if (!upload) choose(e.dataTransfer.files[0])
    }
    const events = { dragenter: onEnter, dragleave: onLeave, dragover: onOver, drop: onDrop }
    for (const [name, handler] of Object.entries(events)) window.addEventListener(name, handler)
    return () => {
      for (const [name, handler] of Object.entries(events)) window.removeEventListener(name, handler)
    }
  }, [upload])

  const start = async () => {
    const controller = new AbortController()
    setUpload(controller)
    setError(null)
    try {
      onLecture(await uploadLecture(file, controller.signal))
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message)
    } finally {
      setUpload(null)
    }
  }

  if (upload) {
    return (
      <Working
        title="Reading your slides"
        messages={READING}
        note="This can take up to half a minute."
        onCancel={() => upload.abort()}
      />
    )
  }

  return (
    <section className="pt-4 sm:pt-10">
      <Eyebrow>Start learning</Eyebrow>
      <Title className="mt-3">Upload your lecture slides</Title>
      <Lead className="mt-4">
        Promptly finds the topics your lecture builds on, then quizzes you on the one you pick, so
        you walk in prepared.
      </Lead>

      <div className="relative mt-20 sm:mt-24">
        {/* The mascot peeks over the upload card. */}
        <Mascot
          sticker
          className="pointer-events-none absolute -top-[66px] right-5 w-[104px] text-ink drop-shadow-[0_10px_16px_rgba(60,20,20,0.25)] motion-safe:animate-bob sm:-top-[84px] sm:right-12 sm:w-[132px]"
        />

        <input
          ref={inputRef}
          id="slides"
          type="file"
          accept="application/pdf,.pdf"
          tabIndex={file ? -1 : 0}
          className="peer sr-only"
          onChange={(e) => {
            choose(e.target.files[0])
            e.target.value = ''
          }}
        />

        {file ? (
          <div className="relative flex items-center gap-4 rounded-[26px] bg-white p-4 shadow-[0_24px_50px_-28px_rgba(70,30,20,0.45)] ring-1 ring-line sm:gap-5 sm:p-6">
            <span className="grid h-14 w-12 shrink-0 place-items-center rounded-lg bg-crimson/8 ring-1 ring-crimson/15">
              <span className="rounded bg-crimson px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                PDF
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{file.name}</p>
              <p className="mt-0.5 text-[0.88rem] text-muted">{formatSize(file.size)} · ready to go</p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current.click()}
              className="hidden rounded-full px-3 py-2 text-[0.9rem] font-semibold text-crimson hover:bg-crimson/5 sm:block"
            >
              Change
            </button>
            <button
              type="button"
              aria-label="Remove file"
              onClick={() => setFile(null)}
              className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-cream hover:text-ink"
            >
              <Icon name="close" className="size-5" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="slides"
            className={`relative flex cursor-pointer flex-col items-center rounded-[26px] border-2 border-dashed px-6 py-12 text-center shadow-[0_24px_50px_-28px_rgba(70,30,20,0.45)] transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-crimson sm:py-16 ${
              dragging
                ? 'scale-[1.01] border-crimson bg-[#fdf5f5]'
                : 'border-[#ddd3c9] bg-white hover:border-crimson/50'
            }`}
          >
            <span className="grid size-16 place-items-center rounded-2xl bg-crimson text-white shadow-[0_16px_30px_-14px_rgba(139,26,43,0.9)]">
              <Icon name="upload" className="size-7" />
            </span>
            <span className="mt-6 text-[1.15rem] font-semibold text-ink sm:text-[1.25rem]">
              {dragging ? (
                'Drop it here'
              ) : (
                <>
                  <span className="sm:hidden">Tap to choose your slides</span>
                  <span className="hidden sm:inline">
                    Drop your slides here, or{' '}
                    <span className="text-crimson underline decoration-crimson/30 underline-offset-4">
                      browse
                    </span>
                  </span>
                </>
              )}
            </span>
            <span className="mt-2 text-[0.9rem] text-muted">
              A PDF with selectable text. Scanned slides won't work.
            </span>
          </label>
        )}
      </div>

      {error && <Alert className="mt-4">{error}</Alert>}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {file && (
          <Button variant="secondary" size="lg" className="sm:hidden" onClick={() => inputRef.current.click()}>
            Choose another file
          </Button>
        )}
        <Button size="lg" disabled={!file} onClick={start}>
          Find prerequisites <Icon name="arrowRight" className="size-5" />
        </Button>
      </div>

      <ol className="mt-14 grid gap-3 border-t border-line pt-8 sm:mt-16 sm:grid-cols-3 sm:gap-6">
        {HOW_IT_WORKS.map((item, i) => (
          <li key={item.title} className="flex items-start gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-crimson shadow-sm ring-1 ring-line">
              <Icon name={item.icon} className="size-5" strokeWidth={1.75} />
            </span>
            <span className="leading-snug">
              <b className="block text-[0.92rem] font-semibold text-ink">
                {i + 1}. {item.title}
              </b>
              <span className="text-[0.86rem] text-muted">{item.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
