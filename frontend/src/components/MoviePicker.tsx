import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "../api/client"
import { posterUrl } from "../lib/images"
import type { MovieSummary } from "../types"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import MoviePosterFallback from "./MoviePosterFallback"

type MoviePickerProps = {
  selected?: MovieSummary | null
  onSelect: (movie: MovieSummary) => void
}

export default function MoviePicker({ selected, onSelect }: MoviePickerProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<MovieSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const debounced = useDebouncedValue(query)

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([])
      return
    }
    let ignore = false
    setLoading(true)
    setError("")
    api.movies
      .search({ query: debounced, page: 1 })
      .then((page) => {
        if (!ignore) setResults(page.results.slice(0, 6))
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
  }, [debounced])

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-white/75">Movie</label>
      {selected && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-mint/30 bg-mint/10 p-2">
          <div className="h-14 w-10 overflow-hidden rounded bg-panel">
            {selected.poster_path ? (
              <img src={posterUrl(selected.poster_path, "w185")} alt={selected.title} className="h-full w-full object-cover" />
            ) : (
              <MoviePosterFallback title={selected.title} />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{selected.title}</p>
            <p className="text-xs text-white/55">Selected</p>
          </div>
        </div>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 text-white/45" size={18} />
        <input
          className="control w-full pl-10"
          placeholder="Search for a movie"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {error && <p className="mt-2 text-xs text-coral">{error}</p>}
      {loading && <p className="mt-2 text-xs text-white/55">Searching...</p>}
      {results.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-panel">
          {results.map((movie) => (
            <button
              type="button"
              key={movie.id}
              className="flex w-full items-center gap-3 border-b border-white/5 p-2 text-left transition last:border-0 hover:bg-white/10"
              onClick={() => {
                onSelect(movie)
                setQuery("")
                setResults([])
              }}
            >
              <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-ink">
                {movie.poster_path ? (
                  <img src={posterUrl(movie.poster_path, "w185")} alt={movie.title} className="h-full w-full object-cover" />
                ) : (
                  <MoviePosterFallback title={movie.title} />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{movie.title}</p>
                <p className="text-xs text-white/50">{movie.release_date?.slice(0, 4) || "TBA"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
