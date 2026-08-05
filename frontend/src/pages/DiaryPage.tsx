import { Trash2 } from "lucide-react"
import { FormEvent, useEffect, useState } from "react"
import { api } from "../api/client"
import EmptyState from "../components/EmptyState"
import ErrorBanner from "../components/ErrorBanner"
import MoviePicker from "../components/MoviePicker"
import StarRating from "../components/StarRating"
import { formatDate } from "../lib/format"
import { posterUrl } from "../lib/images"
import type { DiaryEntry, MovieSummary } from "../types"
import MoviePosterFallback from "../components/MoviePosterFallback"

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [selectedMovie, setSelectedMovie] = useState<MovieSummary | null>(null)
  const [watchDate, setWatchDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  })
  const [rating, setRating] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let ignore = false
    api.diary
      .list()
      .then((data) => {
        if (!ignore) setEntries(data)
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

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selectedMovie) return
    setSubmitting(true)
    setError("")
    try {
      const created = await api.diary.create({
        movie_id: selectedMovie.id,
        watch_date: watchDate,
        rating,
        notes: notes.trim() || undefined,
      })
      setEntries((current) => [created, ...current])
      setSelectedMovie(null)
      setRating(null)
      setNotes("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add diary entry")
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(entryId: number) {
    if (!window.confirm("Delete this diary entry?")) return
    try {
      await api.diary.remove(entryId)
      setEntries((current) => current.filter((entry) => entry.id !== entryId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry")
    }
  }

  return (
    <main className="page-shell animate-fade">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">Journal</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Diary</h1>
      </div>
      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <form className="glass-panel h-fit rounded-lg p-4" onSubmit={submit}>
          <h2 className="text-xl font-bold text-white">Log a watch</h2>
          <div className="mt-4 space-y-4">
            <MoviePicker selected={selectedMovie} onSelect={setSelectedMovie} />
            <div>
              <label htmlFor="diary-date" className="mb-2 block text-sm font-semibold text-white/75">Watch date</label>
              <input id="diary-date" className="control w-full" type="date" value={watchDate} onChange={(event) => setWatchDate(event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/75">Personal rating</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <label htmlFor="diary-notes" className="mb-2 block text-sm font-semibold text-white/75">Notes</label>
              <textarea id="diary-notes" className="control min-h-28 w-full resize-y" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
            <button className="primary-button w-full" disabled={!selectedMovie || submitting} type="submit">
              {submitting ? "Adding..." : "Add diary entry"}
            </button>
          </div>
        </form>

        <section className="space-y-4">
          {loading ? (
            <p className="text-white/55">Loading diary...</p>
          ) : entries.length ? (
            entries.map((entry) => <DiaryRow key={entry.id} entry={entry} onRemove={() => remove(entry.id)} />)
          ) : (
            <EmptyState title="No diary entries" message="Your watched films will collect here." />
          )}
        </section>
      </div>
    </main>
  )
}

function DiaryRow({ entry, onRemove }: { entry: DiaryEntry; onRemove: () => void }) {
  return (
    <article className="glass-panel grid gap-4 rounded-lg p-3 sm:grid-cols-[84px_1fr_auto]">
      <div className="aspect-[2/3] overflow-hidden rounded-lg bg-panel">
        {entry.movie?.poster_path ? (
          <img src={posterUrl(entry.movie.poster_path, "w185")} alt={entry.movie.title} width={185} height={278} className="h-full w-full object-cover" />
        ) : (
          <MoviePosterFallback title={entry.movie?.title} />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-lg font-bold text-white">{entry.movie?.title ?? `Movie ${entry.movie_id}`}</h3>
        <p className="mt-1 text-sm text-white/55">{formatDate(entry.watch_date)}</p>
        <div className="mt-2">
          <StarRating value={entry.rating} readOnly size="sm" />
        </div>
        {entry.notes && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/70">{entry.notes}</p>}
      </div>
      <button className="icon-button self-start" type="button" title="Delete entry" aria-label="Delete diary entry" onClick={onRemove}>
        <Trash2 size={17} />
      </button>
    </article>
  )
}
