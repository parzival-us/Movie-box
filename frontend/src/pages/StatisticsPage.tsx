import { Activity, Clock, Film, Star } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { api } from "../api/client"
import EmptyState from "../components/EmptyState"
import ErrorBanner from "../components/ErrorBanner"
import { formatDate, formatHours } from "../lib/format"
import type { Statistics } from "../types"

export default function StatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let ignore = false
    api
      .statistics()
      .then((data) => {
        if (!ignore) setStats(data)
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

  const maxMonth = useMemo(() => Math.max(...(stats?.monthly_watch_count.map((item) => item.count) ?? [1]), 1), [stats])

  return (
    <main className="page-shell animate-fade">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mint">Patterns</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Statistics</h1>
      </div>
      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}
      {loading && <p className="text-white/55">Loading statistics...</p>}
      {!loading && stats && (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Film />} label="Watched" value={stats.total_movies_watched.toString()} />
            <StatCard icon={<Clock />} label="Runtime" value={formatHours(stats.total_runtime)} />
            <StatCard icon={<Star />} label="Average rating" value={stats.average_rating ? `${stats.average_rating}/5` : "No ratings"} />
            <StatCard icon={<Activity />} label="Activity" value={`${stats.recent_activity.length} recent`} />
          </div>

          {stats.total_movies_watched === 0 ? (
            <EmptyState title="No stats yet" message="Diary entries will populate runtime, ratings, genres, directors, and watch trends." />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Favorite genres">
                <RankedList items={stats.favorite_genres} empty="Genre data needs TMDB credentials." />
              </Panel>
              <Panel title="Favorite directors">
                <RankedList items={stats.favorite_directors} empty="Director data needs TMDB credentials." />
              </Panel>
              <Panel title="Monthly watch count">
                <div className="space-y-3">
                  {stats.monthly_watch_count.map((item) => (
                    <div key={item.month}>
                      <div className="mb-1 flex justify-between text-xs text-white/55">
                        <span>{item.month}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-white/10">
                        <div className="h-full rounded bg-mint" style={{ width: `${(item.count / maxMonth) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Recent activity">
                <div className="space-y-3">
                  {stats.recent_activity.map((item) => (
                    <div key={`${item.type}-${item.movie_id}-${item.timestamp}`} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-sm font-semibold text-white">
                        {item.type} {item.movie?.title ?? `Movie ${item.movie_id}`}
                      </p>
                      <p className="mt-1 text-xs text-white/50">{formatDate(item.timestamp)}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-mint">{icon}</div>
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-panel rounded-lg p-5">
      <h2 className="mb-4 text-xl font-bold text-white">{title}</h2>
      {children}
    </section>
  )
}

function RankedList({ items, empty }: { items: { name: string; count: number }[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-white/55">{empty}</p>
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <span className="font-semibold text-white">{item.name}</span>
          <span className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white/60">{item.count}</span>
        </div>
      ))}
    </div>
  )
}
