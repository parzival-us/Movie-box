import { Heart, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "../api/client"
import EmptyState from "../components/EmptyState"
import ErrorBanner from "../components/ErrorBanner"
import MovieCard from "../components/MovieCard"
import type { LibraryItem, MovieSummary } from "../types"

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
    await api.favorites.remove(movieId)
    setItems((current) => current.filter((item) => item.movie_id !== movieId))
  }

  return (
    <main className="page-shell animate-fade">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Loved</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-black text-white sm:text-5xl">
          <Heart className="fill-coral text-coral" />
          Favorites
        </h1>
      </div>
      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}
      {loading ? (
        <p className="text-white/55">Loading favorites...</p>
      ) : items.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) =>
            <MovieCard
              key={item.id}
              movie={libraryMovie(item)}
              action={
                <button className="icon-button h-8 w-8" type="button" title="Remove" onClick={() => remove(item.movie_id)}>
                  <Trash2 size={14} />
                </button>
              }
            />,
          )}
        </div>
      ) : (
        <EmptyState title="No favorites yet" message="The shelf is waiting for a few personal classics." />
      )}
    </main>
  )
}

function libraryMovie(item: LibraryItem): MovieSummary {
  return item.movie ?? { id: item.movie_id, title: `Movie ${item.movie_id}` }
}
