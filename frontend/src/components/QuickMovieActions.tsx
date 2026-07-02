import { BookmarkPlus, Heart } from "lucide-react"
import { useState } from "react"
import { api } from "../api/client"
import type { MovieSummary } from "../types"

type QuickMovieActionsProps = {
  movie: MovieSummary
}

export default function QuickMovieActions({ movie }: QuickMovieActionsProps) {
  const [watchlisted, setWatchlisted] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [pending, setPending] = useState<"watchlist" | "favorite" | null>(null)

  async function addToWatchlist() {
    setPending("watchlist")
    try {
      await api.watchlist.add(movie.id)
      setWatchlisted(true)
    } finally {
      setPending(null)
    }
  }

  async function addFavorite() {
    setPending("favorite")
    try {
      await api.favorites.add(movie.id)
      setFavorited(true)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex shrink-0 gap-1">
      <button
        className="icon-button h-8 w-8"
        type="button"
        title={watchlisted ? "Added to watchlist" : "Add to watchlist"}
        disabled={pending === "watchlist"}
        onClick={addToWatchlist}
      >
        <BookmarkPlus size={14} className={watchlisted ? "text-mint" : ""} />
      </button>
      <button
        className="icon-button h-8 w-8"
        type="button"
        title={favorited ? "Added to favorites" : "Add favorite"}
        disabled={pending === "favorite"}
        onClick={addFavorite}
      >
        <Heart size={14} className={favorited ? "fill-coral text-coral" : ""} />
      </button>
    </div>
  )
}
