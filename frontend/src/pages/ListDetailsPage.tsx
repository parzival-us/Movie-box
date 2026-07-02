import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Save, Trash2 } from "lucide-react"
import { FormEvent, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api } from "../api/client"
import EmptyState from "../components/EmptyState"
import ErrorBanner from "../components/ErrorBanner"
import MoviePicker from "../components/MoviePicker"
import MoviePosterFallback from "../components/MoviePosterFallback"
import { posterUrl } from "../lib/images"
import type { ListMovie, MovieList, MovieSummary } from "../types"

export default function ListDetailsPage() {
  const { listId } = useParams()
  const id = Number(listId)
  const [list, setList] = useState<MovieList | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<MovieSummary | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    let ignore = false
    setLoading(true)
    api.lists
      .get(id)
      .then((data) => {
        if (!ignore) {
          setList(data)
          setName(data.name)
          setDescription(data.description ?? "")
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
  }, [id])

  async function saveMeta(event: FormEvent) {
    event.preventDefault()
    const updated = await api.lists.update(id, { name, description })
    setList(updated)
  }

  async function addMovie() {
    if (!selectedMovie) return
    const updated = await api.lists.addMovie(id, selectedMovie.id)
    setList(updated)
    setSelectedMovie(null)
  }

  async function removeMovie(movieId: number) {
    const updated = await api.lists.removeMovie(id, movieId)
    setList(updated)
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!list || !over || active.id === over.id) return
    const oldIndex = list.movies.findIndex((item) => item.movie_id === active.id)
    const newIndex = list.movies.findIndex((item) => item.movie_id === over.id)
    const reordered = arrayMove(list.movies, oldIndex, newIndex)
    setList({ ...list, movies: reordered })
    const updated = await api.lists.reorder(id, reordered.map((item) => item.movie_id))
    setList(updated)
  }

  if (loading) {
    return (
      <main className="page-shell animate-fade">
        <p className="text-white/55">Loading list...</p>
      </main>
    )
  }

  if (error || !list) {
    return (
      <main className="page-shell animate-fade">
        <ErrorBanner message={error || "List not found."} />
      </main>
    )
  }

  return (
    <main className="page-shell animate-fade">
      <Link to="/lists" className="text-sm font-semibold text-mint hover:text-mint/80">
        Back to lists
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <form className="glass-panel rounded-lg p-4" onSubmit={saveMeta}>
            <label className="mb-2 block text-sm font-semibold text-white/75">Name</label>
            <input className="control w-full" value={name} onChange={(event) => setName(event.target.value)} />
            <label className="mb-2 mt-4 block text-sm font-semibold text-white/75">Description</label>
            <textarea
              className="control min-h-28 w-full resize-y"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <button className="primary-button mt-4 w-full" type="submit">
              <Save size={17} />
              Save changes
            </button>
          </form>
          <div className="glass-panel rounded-lg p-4">
            <MoviePicker selected={selectedMovie} onSelect={setSelectedMovie} />
            <button className="primary-button mt-4 w-full" type="button" disabled={!selectedMovie} onClick={addMovie}>
              Add movie
            </button>
          </div>
        </aside>

        <section>
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ember">Custom list</p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">{list.name}</h1>
          </div>
          {list.movies.length ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={list.movies.map((item) => item.movie_id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {list.movies.map((item, index) => (
                    <SortableMovie key={item.id} item={item} index={index} onRemove={() => removeMovie(item.movie_id)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <EmptyState title="This list is empty" message="A clean slate for a sharper canon." />
          )}
        </section>
      </div>
    </main>
  )
}

function SortableMovie({ item, index, onRemove }: { item: ListMovie; index: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.movie_id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <article ref={setNodeRef} style={style} className="glass-panel grid grid-cols-[auto_64px_1fr_auto] items-center gap-3 rounded-lg p-3">
      <button className="icon-button cursor-grab" type="button" title="Drag to reorder" {...attributes} {...listeners}>
        <GripVertical size={18} />
      </button>
      <div className="aspect-[2/3] overflow-hidden rounded bg-panel">
        {item.movie?.poster_path ? (
          <img src={posterUrl(item.movie.poster_path, "w185")} alt={item.movie.title} className="h-full w-full object-cover" />
        ) : (
          <MoviePosterFallback title={item.movie?.title} />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-mint">#{index + 1}</p>
        <Link to={`/movies/${item.movie_id}`} className="truncate text-lg font-bold text-white hover:text-mint">
          {item.movie?.title ?? `Movie ${item.movie_id}`}
        </Link>
      </div>
      <button className="icon-button" type="button" title="Remove from list" onClick={onRemove}>
        <Trash2 size={17} />
      </button>
    </article>
  )
}
