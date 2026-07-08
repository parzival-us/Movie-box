import { Star } from "lucide-react"
import { Link } from "react-router-dom"
import type { MovieSummary } from "../types"
import { posterUrl } from "../lib/images"
import { yearFromDate } from "../lib/format"
import MoviePosterFallback from "./MoviePosterFallback"
import QuickMovieActions from "./QuickMovieActions"

type MovieCardProps = {
  movie: MovieSummary
  compact?: boolean
  action?: React.ReactNode
  quickAdd?: boolean
}

export default function MovieCard({ movie, compact = false, action, quickAdd = false }: MovieCardProps) {
  const poster = posterUrl(movie.poster_path)
  const resolvedAction = action ?? (quickAdd ? <QuickMovieActions movie={movie} /> : null)
  return (
    <article className="group rounded-lg">
      <Link
        to={`/movies/${movie.id}`}
        className="block overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03] transition duration-200 hover:-translate-y-1 hover:border-white/25 hover:shadow-glow"
      >
        <div className="aspect-[2/3] overflow-hidden bg-panel">
          {poster ? (
            <img
              src={poster}
              alt={movie.title}
              width={500}
              height={750}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <MoviePosterFallback title={movie.title} />
          )}
        </div>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/movies/${movie.id}`} className="line-clamp-2 text-sm font-semibold text-white hover:text-white/70">
            {movie.title}
          </Link>
          {!compact && (
            <div className="mt-1 flex items-center gap-2 text-xs text-white/40">
              <span>{yearFromDate(movie.release_date)}</span>
              <span className="flex items-center gap-1">
                <Star size={13} className="fill-white/60 text-white/60" />
                {movie.vote_average ? movie.vote_average.toFixed(1) : "NR"}
              </span>
            </div>
          )}
        </div>
        {resolvedAction}
      </div>
    </article>
  )
}
