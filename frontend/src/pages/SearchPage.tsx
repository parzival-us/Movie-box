import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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

  useEffect(() => {
    const sort = searchParams.get("sort")
    if (sort) setSortBy(sort)
  }, [searchParams])
  const [genres, setGenres] = useState<Genre[]>([])
  const [movies, setMovies] = useState<MovieSummary[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const sentinel = useRef<HTMLDivElement | null>(null)
  const debouncedQuery = useDebouncedValue(query)
  const pageRef = useRef(page)
  const loadingMoreRef = useRef(loadingMore)
  const totalPagesRef = useRef(totalPages)
  pageRef.current = page
  loadingMoreRef.current = loadingMore
  totalPagesRef.current = totalPages

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

  const loadMore = useCallback(() => {
    if (loading || loadingMoreRef.current || pageRef.current >= totalPagesRef.current) return
    const nextPage = pageRef.current + 1
    loadingMoreRef.current = true
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
  }, [debouncedQuery, genre, loading, minRating, sortBy, year])

  useEffect(() => {
    const node = sentinel.current
    if (!node) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore()
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <main className="page-shell animate-fade">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">Explore</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Search movies</h1>
      </div>

      <div className="glass-panel mb-6 rounded-lg p-4">
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <div>
            <label htmlFor="search-query" className="sr-only">Search by title</label>
            <input id="search-query" className="control w-full" placeholder="Search by title" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div>
            <label htmlFor="search-genre" className="sr-only">Genre</label>
            <select id="search-genre" className="control w-full" value={genre} onChange={(event) => setGenre(event.target.value)}>
              <option value="">All genres</option>
              {genres.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="search-year" className="sr-only">Year</label>
            <input id="search-year" className="control w-full" placeholder="Year" value={year} onChange={(event) => setYear(event.target.value)} />
          </div>
          <div>
            <label htmlFor="search-rating" className="sr-only">Minimum rating</label>
            <select id="search-rating" className="control w-full" value={minRating} onChange={(event) => setMinRating(event.target.value)}>
              <option value="">Any rating</option>
              <option value="6">6.0+</option>
              <option value="7">7.0+</option>
              <option value="8">8.0+</option>
            </select>
          </div>
          <div>
            <label htmlFor="search-sort" className="sr-only">Sort by</label>
            <select id="search-sort" className="control w-full" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="popularity.desc">Popular</option>
              <option value="vote_average.desc">Top rated</option>
              <option value="primary_release_date.desc">Newest</option>
              <option value="primary_release_date.asc">Oldest</option>
              <option value="title.asc">Title</option>
            </select>
          </div>
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
