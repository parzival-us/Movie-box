import { Film } from "lucide-react"

type MoviePosterFallbackProps = {
  title?: string
  className?: string
}

function hashGray(str: string): [string, string] {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const l1 = 8 + ((hash & 0xff) % 8)
  const l2 = 4 + ((hash >> 8 & 0xff) % 6)
  return [`hsl(0, 0%, ${l1}%)`, `hsl(0, 0%, ${l2}%)`]
}

export default function MoviePosterFallback({ title, className = "" }: MoviePosterFallbackProps) {
  const label = title || "Movie"
  const [c1, c2] = hashGray(label)

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center ${className}`}
      style={{ background: `linear-gradient(145deg, ${c1}, ${c2})` }}
    >
      <Film size={32} className="text-white/20" />
      <span className="line-clamp-3 text-sm font-bold uppercase tracking-[0.15em] text-white/40 leading-5">
        {label}
      </span>
    </div>
  )
}
