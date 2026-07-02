type MoviePosterFallbackProps = {
  title?: string
  className?: string
}

export default function MoviePosterFallback({ title, className = "" }: MoviePosterFallbackProps) {
  return (
    <div className={`flex h-full w-full items-center justify-center bg-panel p-4 text-center ${className}`}>
      <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/35">{title || "Movie"}</span>
    </div>
  )
}
