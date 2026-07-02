import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "../api/client"
import EmptyState from "../components/EmptyState"
import ErrorBanner from "../components/ErrorBanner"
import MovieGrid from "../components/MovieGrid"
import { libraryMovie } from "../lib/libraryMovie"
import type { LibraryItem } from "../types"

export default function WatchlistPage() {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [sort, setSort] = useState("newest")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError("")
    api.watchlist
      .list(sort)
      .then((data) => {
        if (!ignore) setItems(data)
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
  }, [sort])

  async function remove(movieId: number) {
    try {
      await api.watchlist.remove(movieId)
      setItems((current) => current.filter((item) => item.movie_id !== movieId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove from watchlist")
    }
  }

  return (
    <main className="page-shell animate-fade">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mint">To watch</p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Watchlist</h1>
        </div>
        <div>
          <label htmlFor="watchlist-sort" className="sr-only">Sort watchlist</label>
          <select id="watchlist-sort" className="control" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="rating">Rating</option>
            <option value="release_year">Release year</option>
          </select>
        </div>
      </div>
      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}
      {!loading && items.length === 0 ? (
        <EmptyState title="Empty watchlist" message="Save movies to watch later." />
      ) : (
        <MovieGrid
          movies={items.map(libraryMovie)}
          loading={loading}
          emptyTitle="No movies"
          emptyMessage="Your watchlist is empty."
          action={(movie) => (
            <button className="icon-button h-8 w-8" type="button" title="Remove" aria-label="Remove from watchlist" onClick={() => remove(movie.id)}>
              <Trash2 size={14} />
            </button>
          )}
        />
      )}
    </main>
  )
}
