import type { MovieSummary } from "../types"
import EmptyState from "./EmptyState"
import MovieCard from "./MovieCard"
import SkeletonCard from "./SkeletonCard"

type MovieGridProps = {
  movies: MovieSummary[]
  loading?: boolean
  emptyTitle?: string
  emptyMessage?: string
  quickAdd?: boolean
}

export default function MovieGrid({ movies, loading, emptyTitle, emptyMessage, quickAdd = true }: MovieGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    )
  }

  if (!movies.length) {
    return <EmptyState title={emptyTitle ?? "No movies yet"} message={emptyMessage ?? "Try a different search."} />
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} quickAdd={quickAdd} />
      ))}
    </div>
  )
}
