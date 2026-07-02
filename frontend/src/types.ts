export type MovieSummary = {
  id: number
  title: string
  overview?: string
  poster_path?: string | null
  backdrop_path?: string | null
  release_date?: string
  vote_average?: number
  genre_ids?: number[]
  runtime?: number
  genres?: Genre[]
}

export type Genre = {
  id: number
  name: string
}

export type Credit = {
  id: number
  name: string
  character?: string
  job?: string
  profile_path?: string | null
  known_for_department?: string
}

export type Video = {
  id: string
  key: string
  name: string
  site: string
  type: string
}

export type MovieDetails = MovieSummary & {
  runtime?: number
  tagline?: string
  genres: Genre[]
  credits?: {
    cast: Credit[]
    crew: Credit[]
  }
  videos?: {
    results: Video[]
  }
  similar?: MoviePage
  recommendations?: MoviePage
}

export type MoviePage = {
  page: number
  results: MovieSummary[]
  total_pages: number
  total_results: number
}

export type Rating = {
  id: number
  movie_id: number
  rating: number
  created_at: string
  updated_at: string
}

export type Review = {
  id: number
  movie_id: number
  content: string
  created_at: string
  updated_at: string
}

export type LibraryItem = {
  id: number
  movie_id: number
  added_at: string
  movie?: MovieSummary | null
}

export type DiaryEntry = {
  id: number
  movie_id: number
  watch_date: string
  rating?: number | null
  notes?: string | null
  created_at: string
  updated_at: string
  movie?: MovieSummary | null
}

export type MovieList = {
  id: number
  name: string
  description?: string | null
  created_at: string
  updated_at: string
  movies: ListMovie[]
}

export type ListMovie = {
  id: number
  movie_id: number
  position: number
  added_at: string
  movie?: MovieSummary | null
}

export type Statistics = {
  total_movies_watched: number
  total_runtime: number
  average_rating: number | null
  favorite_genres: { name: string; count: number }[]
  favorite_directors: { name: string; count: number }[]
  monthly_watch_count: { month: string; count: number }[]
  recent_activity: { type: string; movie_id: number; timestamp: string; movie?: MovieSummary | null }[]
}
