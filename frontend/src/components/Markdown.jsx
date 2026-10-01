// Just enough Markdown for AI answers: headings, paragraphs, lists, tables,
// quotes, code and **bold** / *italic* / `code`. It builds React elements
// (never raw HTML), so model output can't inject markup.

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\s][^*]*\*)/g

function inline(text) {
  return text.split(INLINE).map((part, i) => {
    if (/^(\*\*|__).+\1$/.test(part)) return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
    if (/^`.+`$/.test(part)) return <code key={i} className="rounded bg-cream px-1 py-0.5 text-[0.9em]">{part.slice(1, -1)}</code>
    if (/^\*.+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())

const BLOCKS = [
  ['code', /^```/],
  ['heading', /^#{1,6}\s+/],
  ['table', /^\s*\|/],
  ['bullet', /^\s*[-*+]\s+/],
  ['number', /^\s*\d+[.)]\s+/],
  ['quote', /^\s*>\s?/],
  ['rule', /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/],
]

const kindOf = (line) => BLOCKS.find(([, pattern]) => pattern.test(line))?.[0] ?? 'text'

function parse(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i += 1
      continue
    }
    const kind = kindOf(line)
    if (kind === 'code') {
      const end = lines.findIndex((l, j) => j > i && /^```/.test(l))
      const stop = end === -1 ? lines.length : end
      blocks.push({ kind, lines: lines.slice(i + 1, stop) })
      i = stop + 1
    } else if (kind === 'heading' || kind === 'rule') {
      blocks.push({ kind, lines: [line] })
      i += 1
    } else {
      // Consecutive lines of the same kind form one block.
      const start = i
      while (i < lines.length && lines[i].trim() && kindOf(lines[i]) === kind) i += 1
      blocks.push({ kind, lines: lines.slice(start, i) })
    }
  }
  return blocks
}

function Block({ kind, lines }) {
  switch (kind) {
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-xl bg-[#2a2522] p-4 text-[0.85rem] leading-relaxed text-[#f3ece4]">
          <code>{lines.join('\n')}</code>
        </pre>
      )
    case 'heading':
      return <p className="font-semibold text-ink">{inline(lines[0].replace(/^#+\s+/, ''))}</p>
    case 'rule':
      return <hr className="border-line" />
    case 'quote':
      return (
        <blockquote className="border-l-3 border-line pl-4 text-muted">
          {inline(lines.map((l) => l.replace(/^\s*>\s?/, '')).join(' '))}
        </blockquote>
      )
    case 'bullet':
      return (
        <ul className="list-disc space-y-1 pl-5 marker:text-faint">
          {lines.map((l, i) => (
            <li key={i}>{inline(l.replace(BLOCKS[3][1], ''))}</li>
          ))}
        </ul>
      )
    case 'number':
      return (
        <ol className="list-decimal space-y-1 pl-5 marker:text-faint" start={parseInt(lines[0], 10) || 1}>
          {lines.map((l, i) => (
            <li key={i}>{inline(l.replace(BLOCKS[4][1], ''))}</li>
          ))}
        </ol>
      )
    case 'table': {
      const rows = lines.filter((l) => !/^\s*\|?[\s:|-]+\|?\s*$/.test(l)).map(cells)
      const [head, ...body] = rows
      return (
        <div className="overflow-x-auto rounded-xl ring-1 ring-line">
          <table className="w-full text-left text-[0.9rem]">
            <thead className="bg-cream">
              <tr>
                {head.map((cell, i) => (
                  <th key={i} className="px-3 py-2 font-semibold text-ink">
                    {inline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {body.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, i) => (
                    <td key={i} className="px-3 py-2 align-top">
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    default:
      return (
        <p>
          {lines.map((l, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {inline(l.trim())}
            </span>
          ))}
        </p>
      )
  }
}

export default function Markdown({ children, className = '' }) {
  return (
    <div className={`space-y-3 text-[0.98rem] leading-relaxed text-ink/90 ${className}`}>
      {parse(children ?? '').map((block, i) => (
        <Block key={i} {...block} />
      ))}
    </div>
  )
}
