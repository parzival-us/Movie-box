import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { api } from "../api/client"
import ErrorBanner from "../components/ErrorBanner"
import MovieGrid from "../components/MovieGrid"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import type { Genre, MovieSummary } from "../types"

export default function SearchPage() {
  const location = useLocation()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const [query, setQuery] = useState("")
  const [genre, setGenre] = useState("")
  const [year, setYear] = useState("")
  const [minRating, setMinRating] = useState("")
  const [sortBy, setSortBy] = useState(searchParams.get("sort") ?? "popularity.desc")
  const [genres, setGenres] = useState<Genre[]>([])
  const [movies, setMovies] = useState<MovieSummary[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const sentinel = useRef<HTMLDivElement | null>(null)
  const debouncedQuery = useDebouncedValue(query)

  useEffect(() => {
    api.movies.genres().then(setGenres).catch(() => setGenres([]))
  }, [])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError("")
    setPage(1)
    api.movies
      .search({ query: debouncedQuery, page: 1, year, genre, min_rating: minRating, sort_by: sortBy })
      .then((result) => {
        if (!ignore) {
          setMovies(result.results)
          setTotalPages(result.total_pages)
        }
      })
      .catch((err: Error) => {
        if (!ignore) setError(err.message)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [debouncedQuery, genre, minRating, sortBy, year])

  useEffect(() => {
    const node = sentinel.current
    if (!node) return
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (!entry.isIntersecting || loading || loadingMore || page >= totalPages) return
      const nextPage = page + 1
      setLoadingMore(true)
      api.movies
        .search({ query: debouncedQuery, page: nextPage, year, genre, min_rating: minRating, sort_by: sortBy })
        .then((result) => {
          setMovies((current) => [...current, ...result.results])
          setPage(nextPage)
          setTotalPages(result.total_pages)
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoadingMore(false))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [debouncedQuery, genre, loading, loadingMore, minRating, page, sortBy, totalPages, year])

  return (
    <main className="page-shell animate-fade">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mint">Explore</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Search movies</h1>
      </div>

      <div className="glass-panel mb-6 rounded-lg p-4">
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <input className="control" placeholder="Search by title" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="control" value={genre} onChange={(event) => setGenre(event.target.value)}>
            <option value="">All genres</option>
            {genres.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <input className="control" placeholder="Year" value={year} onChange={(event) => setYear(event.target.value)} />
          <select className="control" value={minRating} onChange={(event) => setMinRating(event.target.value)}>
            <option value="">Any rating</option>
            <option value="6">6.0+</option>
            <option value="7">7.0+</option>
            <option value="8">8.0+</option>
          </select>
          <select className="control" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="popularity.desc">Popular</option>
            <option value="vote_average.desc">Top rated</option>
            <option value="primary_release_date.desc">Newest</option>
            <option value="primary_release_date.asc">Oldest</option>
            <option value="title.asc">Title</option>
          </select>
        </div>
      </div>

      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}
      <MovieGrid
        movies={movies}
        loading={loading}
        emptyTitle="No matching movies"
        emptyMessage="Try loosening the filters or searching for another title."
      />
      <div ref={sentinel} className="h-12" />
      {loadingMore && <p className="pb-8 text-center text-sm text-white/55">Loading more movies...</p>}
    </main>
  )
}
