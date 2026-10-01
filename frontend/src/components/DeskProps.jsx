// The study desk in the bottom-left corner of the hero: books, a laptop, a
// water bottle and a notebook, standing on the table in the background photo.
//
// Sizes are in "design pixels" of the 1584x992 photo. The photo is drawn with
// object-cover anchored at the bottom, so one design pixel is --u wide and the
// table stays at the same place under the props at any viewport size.

const u = (n) => `calc(var(--u) * ${n})`

const BOOKS = [
  { title: 'Statistics', width: 286, color: '#2b3650', offset: 4 },
  { title: 'Political Theory', width: 298, color: '#7a1f2c', offset: -8 },
  { title: 'Python', width: 310, color: '#232f47', offset: 2 },
]

function Books() {
  return (
    <div className="absolute flex flex-col" style={{ left: u(-24), bottom: u(50) }}>
      {BOOKS.map((book) => (
        <div
          key={book.title}
          className="relative flex items-center rounded-r-[6px] shadow-[0_6px_10px_-6px_rgba(0,0,0,0.6)]"
          style={{
            width: u(book.width),
            height: u(47),
            marginLeft: u(book.offset),
            background: `linear-gradient(180deg, color-mix(in srgb, ${book.color} 80%, white) 0%, ${book.color} 22%, ${book.color} 70%, color-mix(in srgb, ${book.color} 70%, black) 100%)`,
          }}
        >
          {/* Gold bands near the ends of the spine */}
          <span className="absolute inset-y-[18%] border-x border-[#c9a96a]/50" style={{ left: u(40), width: u(6) }} />
          <span className="absolute inset-y-[18%] border-x border-[#c9a96a]/50" style={{ right: u(30), width: u(6) }} />
          <span
            className="font-serif tracking-wide text-[#eadbbd]"
            style={{ marginLeft: u(98), fontSize: u(21) }}
          >
            {book.title}
          </span>
        </div>
      ))}
      {/* Shadow on the table */}
      <span
        className="absolute -z-10 rounded-[50%] bg-black/35 blur-md"
        style={{ left: u(10), right: u(-20), bottom: u(-10), height: u(26) }}
      />
    </div>
  )
}

function Laptop() {
  return (
    <svg
      viewBox="0 0 380 200"
      className="absolute drop-shadow-[0_18px_16px_rgba(40,25,15,0.35)]"
      style={{ left: u(222), bottom: u(76), width: u(380) }}
    >
      <defs>
        <linearGradient id="lid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1f2f4" />
          <stop offset="0.55" stopColor="#d9dce0" />
          <stop offset="1" stopColor="#b9bec5" />
        </linearGradient>
        <linearGradient id="base" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8d939b" />
          <stop offset="1" stopColor="#c5c9ce" />
        </linearGradient>
      </defs>
      {/* Base, seen edge-on */}
      <path d="M30 182 L352 160 Q362 160 364 168 L44 194 Q32 194 30 182Z" fill="url(#base)" />
      {/* Back of the lid */}
      <path
        d="M24 30 Q22 14 38 13 L320 2 Q336 1 338 17 L352 152 Q353 164 340 165 L46 188 Q33 189 32 176Z"
        fill="url(#lid)"
        stroke="#aeb3ba"
        strokeWidth="1.5"
      />
      {/* Hinge */}
      <path d="M44 184 L344 162" stroke="#7d838b" strokeWidth="4" strokeLinecap="round" />
      {/* Soft reflection */}
      <path d="M60 20 L200 12 L120 182 L40 186Z" fill="white" opacity="0.25" />
    </svg>
  )
}

function Bottle() {
  return (
    <div className="absolute" style={{ left: u(440), bottom: u(104), width: u(52) }}>
      <div
        className="mx-auto rounded-t-[6px] bg-gradient-to-r from-[#5a0f1b] via-[#7b1626] to-[#4a0c16]"
        style={{ width: u(34), height: u(22) }}
      />
      <div
        className="relative flex flex-col items-center justify-center rounded-[12px] bg-gradient-to-r from-[#9b2234] via-[#b42a3f] to-[#6e1422] shadow-[0_10px_14px_-8px_rgba(0,0,0,0.6)]"
        style={{ height: u(96), gap: u(4) }}
      >
        {['×', '×', '×'].map((x, i) => (
          <span key={i} className="font-black leading-none text-white" style={{ fontSize: u(20) }}>
            {x}
          </span>
        ))}
        <span className="absolute inset-y-[8%] left-[18%] w-[10%] rounded-full bg-white/25" />
      </div>
    </div>
  )
}

// A spiral notebook lying flat at the front of the table, with a pen on it.
function Notebook() {
  const flat = { transform: 'skewX(-32deg)' }
  return (
    <div className="absolute" style={{ left: u(712), bottom: u(40), width: u(250), height: u(38) }}>
      <div
        className="absolute inset-0 rounded-[3px] bg-[#2e2927] shadow-[0_12px_14px_-8px_rgba(0,0,0,0.65)]"
        style={flat}
      />
      <div
        className="absolute rounded-[2px] bg-gradient-to-b from-white to-[#ede6db]"
        style={{ ...flat, inset: `${u(5)} ${u(5)} ${u(7)} ${u(3)}` }}
      >
        <div className="absolute inset-x-[5%] flex justify-between" style={{ top: u(-4), height: u(8) }}>
          {Array.from({ length: 13 }, (_, i) => (
            <span key={i} className="h-full w-[2.4%] rounded-full bg-[#4a4441]" />
          ))}
        </div>
      </div>
      <div
        className="absolute rounded-full bg-gradient-to-b from-[#45454a] to-[#121214] shadow-[0_3px_4px_-1px_rgba(0,0,0,0.5)]"
        style={{ left: u(96), top: u(14), width: u(104), height: u(8), rotate: '-7deg' }}
      >
        <span className="absolute top-0 right-[16%] h-full w-[10%] bg-[#c9a96a]" />
      </div>
    </div>
  )
}

export default function DeskProps() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-5 hidden xl:tall:block"
      style={{ '--u': 'max(calc(100vw / 1584), calc(100svh / 992))' }}
    >
      <Laptop />
      <Bottle />
      <Books />
      <Notebook />
    </div>
  )
}
