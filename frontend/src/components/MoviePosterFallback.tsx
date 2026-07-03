import { Film } from "lucide-react"

type MoviePosterFallbackProps = {
  title?: string
  className?: string
}

// Deterministic color from title string so each movie gets a unique gradient
function hashColor(str: string): [string, string] {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h1 = ((hash & 0xff) % 360)
  const h2 = (h1 + 40) % 360
  return [`hsl(${h1}, 55%, 25%)`, `hsl(${h2}, 65%, 15%)`]
}

export default function MoviePosterFallback({ title, className = "" }: MoviePosterFallbackProps) {
  const label = title || "Movie"
  const [c1, c2] = hashColor(label)

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center ${className}`}
      style={{ background: `linear-gradient(145deg, ${c1}, ${c2})` }}
    >
      <Film size={32} className="text-white/30" />
      <span className="line-clamp-3 text-sm font-bold uppercase tracking-[0.15em] text-white/60 leading-5">
        {label}
      </span>
    </div>
  )
}
