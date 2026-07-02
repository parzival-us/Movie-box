import { ListPlus, Trash2 } from "lucide-react"
import { FormEvent, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../api/client"
import EmptyState from "../components/EmptyState"
import ErrorBanner from "../components/ErrorBanner"
import type { MovieList } from "../types"

export default function ListsPage() {
  const [lists, setLists] = useState<MovieList[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let ignore = false
    api.lists
      .list()
      .then((data) => {
        if (!ignore) setLists(data)
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

  async function create(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    const created = await api.lists.create({ name: name.trim(), description: description.trim() || undefined })
    setLists((current) => [created, ...current])
    setName("")
    setDescription("")
  }

  async function remove(listId: number) {
    await api.lists.remove(listId)
    setLists((current) => current.filter((list) => list.id !== listId))
  }

  return (
    <main className="page-shell animate-fade">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ember">Curate</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Lists</h1>
      </div>
      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <form className="glass-panel h-fit rounded-lg p-4" onSubmit={create}>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <ListPlus size={20} />
            New list
          </h2>
          <div className="mt-4 space-y-3">
            <input className="control w-full" placeholder="List name" value={name} onChange={(event) => setName(event.target.value)} />
            <textarea
              className="control min-h-24 w-full resize-y"
              placeholder="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <button className="primary-button w-full" type="submit" disabled={!name.trim()}>
              Create list
            </button>
          </div>
        </form>

        <section>
          {loading ? (
            <p className="text-white/55">Loading lists...</p>
          ) : lists.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {lists.map((list) => (
                <article key={list.id} className="glass-panel rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/lists/${list.id}`} className="min-w-0">
                      <h2 className="truncate text-xl font-bold text-white hover:text-mint">{list.name}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/60">{list.description || "No description"}</p>
                    </Link>
                    <button className="icon-button" type="button" title="Delete list" onClick={() => remove(list.id)}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <p className="mt-4 text-sm text-white/45">{list.movies.length} movies</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No lists yet" message="Create a ranked list, seasonal watch set, or personal canon." />
          )}
        </section>
      </div>
    </main>
  )
}
