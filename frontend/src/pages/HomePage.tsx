import { Play, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../api/client"
import ErrorBanner from "../components/ErrorBanner"
import SectionShelf from "../components/SectionShelf"
import { backdropUrl, posterUrl } from "../lib/images"
import type { MoviePage, MovieSummary } from "../types"

type HomeState = {
  trending?: MoviePage
  popular?: MoviePage
  topRated?: MoviePage
  upcoming?: MoviePage
}

export default function HomePage() {
  const [home, setHome] = useState<HomeState>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let ignore = false
    setLoading(true)
    Promise.allSettled([
      api.movies.trending(),
      api.movies.popular(),
      api.movies.topRated(),
      api.movies.upcoming(),
    ]).then(([trending, popular, topRated, upcoming]) => {
      if (ignore) return
      const state: HomeState = {}
      if (trending.status === "fulfilled") state.trending = trending.value
      if (popular.status === "fulfilled") state.popular = popular.value
      if (topRated.status === "fulfilled") state.topRated = topRated.value
      if (upcoming.status === "fulfilled") state.upcoming = upcoming.value
      setHome(state)
      const allFailed = [trending, popular, topRated, upcoming].every((r) => r.status === "rejected")
      if (allFailed) {
        const reason = trending.status === "rejected" ? trending.reason : undefined
        setError(reason instanceof Error ? reason.message : "Failed to load movies.")
      }
      setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [])

  const hero = home.trending?.results[0]

  return (
    <main className="animate-fade">
      <Hero movie={hero} loading={loading} />
      <div className="page-shell">
        {error && <ErrorBanner message={error} />}
        <SectionShelf title="Trending this week" movies={home.trending?.results} to="/search?sort=popularity.desc" loading={loading} />
        <SectionShelf title="Popular" movies={home.popular?.results} to="/search?sort=popularity.desc" loading={loading} />
        <SectionShelf title="Top rated" movies={home.topRated?.results} to="/search?sort=vote_average.desc" loading={loading} />
        <SectionShelf title="Coming soon" movies={home.upcoming?.results} to="/search?sort=primary_release_date.desc" loading={loading} />
      </div>
    </main>
  )
}

function Hero({ movie, loading }: { movie?: MovieSummary; loading: boolean }) {
  const backdrop = backdropUrl(movie?.backdrop_path)
  return (
    <section className="relative min-h-[58vh] overflow-hidden border-b border-white/10" aria-label="Featured movie">
      {backdrop ? (
        <img src={backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(130deg,#111827,#07090d_55%,#10231d)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/25" />
      <div className="page-shell relative flex min-h-[58vh] items-end pb-10">
        <div className="grid w-full gap-6 md:grid-cols-[1fr_220px] md:items-end">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-lg border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-mint">
              Now in focus
            </p>
            {loading ? (
              <div className="space-y-4">
                <div className="h-12 w-3/4 animate-pulse rounded bg-white/10" />
                <div className="h-5 w-full animate-pulse rounded bg-white/10" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl">{movie?.title ?? "Movie Box"}</h1>
                <p className="mt-4 line-clamp-3 max-w-2xl text-base leading-7 text-white/75">{movie?.overview}</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {movie && (
                    <Link to={`/movies/${movie.id}`} className="primary-button">
                      <Play size={18} />
                      View details
                    </Link>
                  )}
                  <span className="secondary-button">
                    <Star size={18} className="fill-ember text-ember" />
                    {movie?.vote_average ? movie.vote_average.toFixed(1) : "No rating"}
                  </span>
                </div>
              </>
            )}
          </div>
          {movie?.poster_path && (
            <Link
              to={`/movies/${movie.id}`}
              className="hidden aspect-[2/3] overflow-hidden rounded-lg border border-white/15 bg-white/10 shadow-glow md:block"
            >
              <img src={posterUrl(movie.poster_path)} alt={movie.title} width={500} height={750} className="h-full w-full object-cover" />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
