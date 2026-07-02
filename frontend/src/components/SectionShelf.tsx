import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import type { MovieSummary } from "../types"
import MovieCard from "./MovieCard"
import SkeletonCard from "./SkeletonCard"

type SectionShelfProps = {
  title: string
  movies?: MovieSummary[]
  to?: string
  loading?: boolean
  quickAdd?: boolean
}

export default function SectionShelf({ title, movies = [], to, loading, quickAdd = true }: SectionShelfProps) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {to && (
          <Link to={to} className="flex items-center gap-1 text-sm font-semibold text-mint hover:text-mint/80">
            View all
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : movies.slice(0, 6).map((movie) => <MovieCard key={movie.id} movie={movie} compact quickAdd={quickAdd} />)}
      </div>
    </section>
  )
}
