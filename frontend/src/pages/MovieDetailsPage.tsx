import { CalendarPlus, Heart, Pencil, Plus, Trash2 } from "lucide-react"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../api/client"
import EmptyState from "../components/EmptyState"
import ErrorBanner from "../components/ErrorBanner"
import MovieCard from "../components/MovieCard"
import StarRating from "../components/StarRating"
import { backdropUrl, posterUrl, profileUrl } from "../lib/images"
import { formatDate, formatRuntime } from "../lib/format"
import type { Credit, MovieDetails, Review } from "../types"
import MoviePosterFallback from "../components/MoviePosterFallback"

export default function MovieDetailsPage() {
  const { movieId } = useParams()
  const id = Number(movieId)
  const [movie, setMovie] = useState<MovieDetails | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [watchlisted, setWatchlisted] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewText, setReviewText] = useState("")
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    let ignore = false
    setLoading(true)
    setError("")
    Promise.all([
      api.movies.details(id),
      api.ratings.get(id),
      api.watchlist.status(id),
      api.favorites.status(id),
      api.reviews.list(id),
    ])
      .then(([details, userRating, watchlistStatus, favoriteStatus, reviewList]) => {
        if (!ignore) {
          setMovie(details)
          setRating(userRating?.rating ?? null)
          setWatchlisted(watchlistStatus.exists)
          setFavorited(favoriteStatus.exists)
          setReviews(reviewList)
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

  const trailer = useMemo(
    () =>
      movie?.videos?.results.find((video) => video.site === "YouTube" && video.type === "Trailer") ??
      movie?.videos?.results.find((video) => video.site === "YouTube"),
    [movie],
  )

  const directors = movie?.credits?.crew.filter((person) => person.job === "Director") ?? []
  const cast = movie?.credits?.cast.slice(0, 12) ?? []

  async function handleRatingChange(value: number) {
    setRating(value)
    const saved = await api.ratings.set(id, value)
    setRating(saved.rating)
  }

  async function toggleWatchlist() {
    if (watchlisted) {
      await api.watchlist.remove(id)
      setWatchlisted(false)
    } else {
      await api.watchlist.add(id)
      setWatchlisted(true)
    }
  }

  async function toggleFavorite() {
    if (favorited) {
      await api.favorites.remove(id)
      setFavorited(false)
    } else {
      await api.favorites.add(id)
      setFavorited(true)
    }
  }

  async function submitReview(event: FormEvent) {
    event.preventDefault()
    if (!reviewText.trim()) return
    if (editingReview) {
      const updated = await api.reviews.update(editingReview.id, reviewText.trim())
      setReviews((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setEditingReview(null)
    } else {
      const created = await api.reviews.create(id, reviewText.trim())
      setReviews((current) => [created, ...current])
    }
    setReviewText("")
  }

  async function deleteReview(reviewId: number) {
    await api.reviews.remove(reviewId)
    setReviews((current) => current.filter((review) => review.id !== reviewId))
  }

  if (loading) {
    return (
      <main className="page-shell animate-fade">
        <div className="h-[520px] animate-pulse rounded-lg bg-white/10" />
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

  if (!movie) {
    return (
      <main className="page-shell animate-fade">
        <EmptyState title="Movie not found" message="The selected movie could not be loaded." />
      </main>
    )
  }

  return (
    <main className="animate-fade">
      <section className="relative overflow-hidden border-b border-white/10">
        {movie.backdrop_path && (
          <img src={backdropUrl(movie.backdrop_path)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/35" />
        <div className="page-shell relative grid gap-8 py-10 lg:grid-cols-[300px_1fr]">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-panel shadow-glow">
            {movie.poster_path ? (
              <img src={posterUrl(movie.poster_path)} alt={movie.title} className="h-full w-full object-cover" />
            ) : (
              <MoviePosterFallback title={movie.title} className="aspect-[2/3]" />
            )}
          </div>
          <div className="self-end">
            <div className="mb-4 flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span key={genre.id} className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/75">
                  {genre.name}
                </span>
              ))}
            </div>
            <h1 className="text-4xl font-black text-white sm:text-6xl">{movie.title}</h1>
            {movie.tagline && <p className="mt-3 text-lg italic text-white/65">{movie.tagline}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/65">
              <span>{formatDate(movie.release_date)}</span>
              <span>{formatRuntime(movie.runtime)}</span>
              <span>TMDB {movie.vote_average?.toFixed(1) ?? "NR"}</span>
              {directors.length > 0 && <span>Directed by {directors.map((director) => director.name).join(", ")}</span>}
            </div>
            <p className="mt-6 max-w-3xl text-base leading-7 text-white/75">{movie.overview}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="glass-panel rounded-lg px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Your rating</p>
                <StarRating value={rating} onChange={handleRatingChange} />
              </div>
              <button type="button" className="secondary-button" onClick={toggleWatchlist}>
                {watchlisted ? <CalendarPlus size={18} className="text-mint" /> : <Plus size={18} />}
                {watchlisted ? "In watchlist" : "Watchlist"}
              </button>
              <button type="button" className="secondary-button" onClick={toggleFavorite}>
                <Heart size={18} className={favorited ? "fill-coral text-coral" : ""} />
                {favorited ? "Favorited" : "Favorite"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="page-shell grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          {trailer && (
            <section>
              <h2 className="mb-4 text-2xl font-bold text-white">Trailer</h2>
              <div className="aspect-video overflow-hidden rounded-lg border border-white/10 bg-panel">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  title={trailer.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">Cast</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {cast.map((person) => (
                <PersonCard key={`${person.id}-${person.character}`} person={person} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">Similar movies</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {movie.similar?.results.slice(0, 10).map((item) => <MovieCard key={item.id} movie={item} compact />)}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="glass-panel rounded-lg p-4">
            <h2 className="text-xl font-bold text-white">Review</h2>
            <form className="mt-4 space-y-3" onSubmit={submitReview}>
              <textarea
                className="control min-h-32 w-full resize-y"
                value={reviewText}
                placeholder="What stayed with you?"
                onChange={(event) => setReviewText(event.target.value)}
              />
              <button className="primary-button w-full" type="submit">
                {editingReview ? "Save review" : "Post review"}
              </button>
            </form>
          </section>

          <section className="space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="glass-panel rounded-lg p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-white/75">{review.content}</p>
                <div className="mt-4 flex items-center justify-between gap-2 text-xs text-white/45">
                  <span>{formatDate(review.updated_at)}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="icon-button h-8 w-8"
                      title="Edit review"
                      onClick={() => {
                        setEditingReview(review)
                        setReviewText(review.content)
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button type="button" className="icon-button h-8 w-8" title="Delete review" onClick={() => deleteReview(review.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </aside>
      </div>
    </main>
  )
}

function PersonCard({ person }: { person: Credit }) {
  return (
    <div className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.05] p-2">
      <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-panel">
        {person.profile_path ? (
          <img src={profileUrl(person.profile_path)} alt={person.name} className="h-full w-full object-cover" />
        ) : (
          <MoviePosterFallback title={person.name} />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{person.name}</p>
        <p className="line-clamp-2 text-xs text-white/50">{person.character}</p>
      </div>
    </div>
  )
}
