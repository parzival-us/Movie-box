import { BarChart3, Clock, Film, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../api/client"
import ErrorBanner from "../components/ErrorBanner"
import StarRating from "../components/StarRating"
import { posterUrl } from "../lib/images"
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

  if (loading) {
    return (
      <main className="page-shell animate-fade">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg bg-white/10" />
          ))}
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page-shell animate-fade">
        <ErrorBanner message={error} />
      </main>
    )
  }

  if (!stats) {
    return (
      <main className="page-shell animate-fade">
        <ErrorBanner message="Statistics unavailable." />
      </main>
    )
  }

  return (
    <main className="page-shell animate-fade">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mint">Overview</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">Statistics</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Film} label="Films watched" value={stats.total_watches} />
        <StatCard icon={Clock} label="Total runtime" value={formatHours(stats.total_runtime)} />
        <StatCard
          icon={Star}
          label="Average rating"
          value={
            stats.average_rating !== null ? (
              <span className="flex items-center gap-2">
                <StarRating value={stats.average_rating} readOnly size="sm" />
                <span className="text-base text-white/65">{stats.average_rating.toFixed(1)}</span>
              </span>
            ) : (
              "–"
            )
          }
        />
        <StatCard icon={BarChart3} label="Diary entries" value={stats.monthly_watch_count.reduce((sum, item) => sum + item.count, 0)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="glass-panel rounded-lg p-5">
          <h2 className="text-xl font-bold text-white">Favorite genres</h2>
          <div className="mt-4 space-y-3">
            {stats.favorite_genres.length === 0 && <p className="text-sm text-white/55">No data yet.</p>}
            {stats.favorite_genres.map((genre) => {
              const maxCount = stats.favorite_genres[0]?.count ?? 1
              const width = Math.max((genre.count / maxCount) * 100, 6)
              return (
                <div key={genre.name}>
                  <div className="mb-1 flex items-center justify-between text-sm text-white/75">
                    <span>{genre.name}</span>
                    <span className="text-white/45">{genre.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-mint transition-[width] duration-500" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="glass-panel rounded-lg p-5">
          <h2 className="text-xl font-bold text-white">Favorite directors</h2>
          <div className="mt-4 space-y-3">
            {stats.favorite_directors.length === 0 && <p className="text-sm text-white/55">No data yet.</p>}
            {stats.favorite_directors.map((director) => {
              const maxCount = stats.favorite_directors[0]?.count ?? 1
              const width = Math.max((director.count / maxCount) * 100, 6)
              return (
                <div key={director.name}>
                  <div className="mb-1 flex items-center justify-between text-sm text-white/75">
                    <span>{director.name}</span>
                    <span className="text-white/45">{director.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-ember transition-[width] duration-500" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="glass-panel rounded-lg p-5">
          <h2 className="text-xl font-bold text-white">Watches per month</h2>
          {stats.monthly_watch_count.length === 0 ? (
            <p className="mt-4 text-sm text-white/55">No data yet.</p>
          ) : (
            <div className="mt-4 flex items-end gap-1.5 h-40">
              {stats.monthly_watch_count.map((item) => {
                const maxCount = Math.max(...stats.monthly_watch_count.map((row) => row.count), 1)
                const height = (item.count / maxCount) * 100
                return (
                  <div key={item.month} className="flex flex-1 flex-col items-center gap-1 h-full justify-end" title={`${item.month}: ${item.count}`}>
                    <span className="text-[10px] text-white/40">{item.count}</span>
                    <div className="w-full rounded-t bg-gradient-to-t from-mint/60 to-mint transition-[height] duration-500" style={{ height: `${Math.max(height, 4)}%` }} />
                    <span className="text-[10px] text-white/40">{item.month.slice(5)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="glass-panel rounded-lg p-5">
          <h2 className="text-xl font-bold text-white">Recent activity</h2>
          <div className="mt-4 space-y-3">
            {stats.recent_activity.length === 0 && <p className="text-sm text-white/55">No activity yet.</p>}
            {stats.recent_activity.map((activity, index) => (
              <div key={`${activity.type}-${activity.movie_id}-${index}`} className="flex items-center gap-3">
                {activity.movie?.poster_path ? (
                  <img src={posterUrl(activity.movie.poster_path, "w92")} alt="" className="h-12 w-8 shrink-0 rounded object-cover" />
                ) : (
                  <div className="h-12 w-8 shrink-0 rounded bg-white/10" />
                )}
                <div className="min-w-0">
                  <Link to={`/movies/${activity.movie_id}`} className="block truncate text-sm font-semibold text-white hover:text-mint">
                    {activity.movie?.title ?? `Movie ${activity.movie_id}`}
                  </Link>
                  <span className="text-xs text-white/45 capitalize">{activity.type} · {formatDate(activity.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Film; label: string; value: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="flex items-center gap-3 text-white/55">
        <Icon size={20} />
        <span className="text-sm font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-3 text-3xl font-black text-white">{value}</div>
    </div>
  )
}
