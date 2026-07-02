import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "../api/client"
import EmptyState from "../components/EmptyState"
import ErrorBanner from "../components/ErrorBanner"
import MovieGrid from "../components/MovieGrid"
import { libraryMovie } from "../lib/libraryMovie"
import type { LibraryItem } from "../types"

export default function FavoritesPage() {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let ignore = false
    api.favorites
      .list()
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
  }, [])

  async function remove(movieId: number) {
    try {
      await api.favorites.remove(movieId)
      setItems((current) => current.filter((item) => item.movie_id !== movieId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove from favorites")
    }
  }

  return (
    <main className="page-shell animate-fade">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mint">Loved films</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Favorites</h1>
      </div>
      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}
      {!loading && items.length === 0 ? (
        <EmptyState title="No favorites yet" message="Heart some movies to collect them here." />
      ) : (
        <MovieGrid
          movies={items.map(libraryMovie)}
          loading={loading}
          emptyTitle="No favorites"
          emptyMessage="Mark films as favorites to see them here."
          action={(movie) => (
            <button className="icon-button h-8 w-8" type="button" title="Remove" aria-label="Remove from favorites" onClick={() => remove(movie.id)}>
              <Trash2 size={14} />
            </button>
          )}
        />
      )}
    </main>
  )
}
