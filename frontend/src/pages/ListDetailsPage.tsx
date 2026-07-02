import { GripVertical, Pencil, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../api/client"
import EmptyState from "../components/EmptyState"
import ErrorBanner from "../components/ErrorBanner"
import MovieCard from "../components/MovieCard"
import MoviePicker from "../components/MoviePicker"
import type { MovieList, MovieSummary } from "../types"

export default function ListDetailsPage() {
  const { listId } = useParams()
  const id = Number(listId)
  const [list, setList] = useState<MovieList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id || isNaN(id)) return
    let ignore = false
    setLoading(true)
    setError("")
    api.lists
      .get(id)
      .then((data) => {
        if (!ignore) setList(data)
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
  }, [id])

  function startEditing() {
    if (!list) return
    setEditName(list.name)
    setEditDescription(list.description ?? "")
    setEditing(true)
  }

  async function saveEdits() {
    if (!editName.trim()) return
    setSaving(true)
    setError("")
    try {
      const updated = await api.lists.update(id, { name: editName.trim(), description: editDescription.trim() || undefined })
      setList(updated)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update list")
    } finally {
      setSaving(false)
    }
  }

  async function addMovie(movie: MovieSummary) {
    setError("")
    try {
      const updated = await api.lists.addMovie(id, movie.id)
      setList(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add movie")
    }
  }

  async function removeMovie(movieId: number) {
    setError("")
    try {
      const updated = await api.lists.removeMovie(id, movieId)
      setList(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove movie")
    }
  }

  if (!id || isNaN(id)) {
    return (
      <main className="page-shell animate-fade">
        <ErrorBanner message="Invalid list ID." />
      </main>
    )
  }

  if (loading) {
    return (
      <main className="page-shell animate-fade">
        <div className="h-[200px] animate-pulse rounded-lg bg-white/10" />
      </main>
    )
  }

  if (error && !list) {
    return (
      <main className="page-shell animate-fade">
        <ErrorBanner message={error} />
      </main>
    )
  }

  if (!list) {
    return (
      <main className="page-shell animate-fade">
        <EmptyState title="List not found" message="The list you're looking for doesn't exist." />
      </main>
    )
  }

  return (
    <main className="page-shell animate-fade">
      <div className="mb-6">
        {editing ? (
          <div className="glass-panel rounded-lg p-4 space-y-3">
            <div>
              <label htmlFor="edit-list-name" className="mb-1.5 block text-sm font-semibold text-white/75">Name</label>
              <input id="edit-list-name" className="control w-full" value={editName} onChange={(event) => setEditName(event.target.value)} />
            </div>
            <div>
              <label htmlFor="edit-list-desc" className="mb-1.5 block text-sm font-semibold text-white/75">Description</label>
              <textarea id="edit-list-desc" className="control w-full min-h-20 resize-y" value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
            </div>
            <div className="flex gap-3">
              <button className="primary-button" type="button" disabled={!editName.trim() || saving} onClick={saveEdits}>{saving ? "Saving..." : "Save"}</button>
              <button className="secondary-button" type="button" onClick={() => setEditing(false)}>
                <X size={16} />Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mint">List</p>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">{list.name}</h1>
              {list.description && <p className="mt-3 text-base text-white/65">{list.description}</p>}
              <p className="mt-2 text-sm text-white/45">{list.movies.length} movies</p>
            </div>
            <button className="secondary-button" type="button" onClick={startEditing}>
              <Pencil size={16} />Edit
            </button>
          </div>
        )}
      </div>

      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

      <div className="mb-6 glass-panel rounded-lg p-4">
        <h2 className="mb-3 text-sm font-bold text-white">Add movie</h2>
        <MoviePicker selected={null} onSelect={(movie) => movie && addMovie(movie)} />
      </div>

      {list.movies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {list.movies.map((listMovie) => {
            const movie: MovieSummary = listMovie.movie ?? { id: listMovie.movie_id, title: `Movie ${listMovie.movie_id}` }
            return (
              <MovieCard
                key={listMovie.id}
                movie={movie}
                action={
                  <button className="icon-button h-8 w-8" type="button" title="Remove" aria-label="Remove from list" onClick={() => removeMovie(listMovie.movie_id)}>
                    <Trash2 size={14} />
                  </button>
                }
              />
            )
          })}
        </div>
      ) : (
        <EmptyState title="Empty list" message="Search and add movies to build your list." />
      )}
    </main>
  )
}
