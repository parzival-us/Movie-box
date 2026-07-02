import { Pencil, Plus, Trash2 } from "lucide-react"
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
  const [creating, setCreating] = useState(false)

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

  async function submitList(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError("")
    try {
      const created = await api.lists.create({ name: name.trim(), description: description.trim() || undefined })
      setLists((current) => [...current, created])
      setName("")
      setDescription("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create list")
    } finally {
      setCreating(false)
    }
  }

  async function deleteList(listId: number) {
    if (!window.confirm("Delete this list?")) return
    try {
      await api.lists.remove(listId)
      setLists((current) => current.filter((item) => item.id !== listId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete list")
    }
  }

  return (
    <main className="page-shell animate-fade">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mint">Collections</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Lists</h1>
      </div>
      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        <form className="glass-panel h-fit rounded-lg p-4" onSubmit={submitList}>
          <h2 className="text-xl font-bold text-white">New list</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="list-name" className="mb-1.5 block text-sm font-semibold text-white/75">Name</label>
              <input id="list-name" className="control w-full" placeholder="e.g. Winter picks" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div>
              <label htmlFor="list-desc" className="mb-1.5 block text-sm font-semibold text-white/75">Description</label>
              <textarea id="list-desc" className="control min-h-28 w-full resize-y" value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
            <button className="primary-button w-full" type="submit" disabled={!name.trim() || creating}>
              <Plus size={18} />{creating ? "Creating..." : "Create list"}
            </button>
          </div>
        </form>

        <section className="space-y-4">
          {loading ? (
            <p className="text-white/55">Loading lists...</p>
          ) : lists.length ? (
            lists.map((list) => (
              <article key={list.id} className="glass-panel flex items-center justify-between rounded-lg p-4">
                <Link to={`/lists/${list.id}`} className="flex-1 min-w-0 group">
                  <h3 className="text-lg font-bold text-white group-hover:text-mint">{list.name}</h3>
                  {list.description && <p className="mt-1 truncate text-sm text-white/55">{list.description}</p>}
                  <p className="mt-2 text-xs text-white/40">{list.movies.length} movies</p>
                </Link>
                <div className="flex items-center gap-2 ml-3">
                  <Link to={`/lists/${list.id}`} className="icon-button h-8 w-8" title="Edit list" aria-label="Edit list">
                    <Pencil size={14} />
                  </Link>
                  <button className="icon-button h-8 w-8" type="button" title="Delete list" aria-label="Delete list" onClick={() => deleteList(list.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <EmptyState title="No lists yet" message="Create a new list to curate collections of movies." />
          )}
        </section>
      </div>
    </main>
  )
}
