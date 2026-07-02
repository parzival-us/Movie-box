import type {
  DiaryEntry,
  Genre,
  LibraryItem,
  MovieDetails,
  MovieList,
  MoviePage,
  Rating,
  Review,
  Statistics,
} from "../types"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api"

type QueryValue = string | number | boolean | null | undefined

function withQuery(path: string, params: Record<string, QueryValue> = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value))
    }
  })
  return query.size ? `${path}?${query}` : path
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  })

  if (!response.ok) {
    let message = `Request failed with ${response.status}`
    try {
      const error = await response.json()
      message = typeof error.detail === "string" ? error.detail : message
    } catch {
      // Leave the generic message in place.
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  health: () => apiFetch<{ status: string }>("/health"),
  movies: {
    trending: (page = 1) => apiFetch<MoviePage>(withQuery("/movies/trending", { page })),
    popular: (page = 1) => apiFetch<MoviePage>(withQuery("/movies/popular", { page })),
    topRated: (page = 1) => apiFetch<MoviePage>(withQuery("/movies/top-rated", { page })),
    upcoming: (page = 1) => apiFetch<MoviePage>(withQuery("/movies/upcoming", { page })),
    genres: async () => (await apiFetch<{ genres: Genre[] }>("/movies/genres")).genres,
    search: (params: {
      query?: string
      page?: number
      year?: string | number
      genre?: string
      min_rating?: string | number
      sort_by?: string
    }) => apiFetch<MoviePage>(withQuery("/movies/search", params)),
    details: (movieId: number) => apiFetch<MovieDetails>(`/movies/${movieId}`),
  },
  ratings: {
    get: (movieId: number) => apiFetch<Rating | null>(`/ratings/${movieId}`),
    set: (movieId: number, rating: number) =>
      apiFetch<Rating>("/ratings", { method: "POST", body: JSON.stringify({ movie_id: movieId, rating }) }),
    remove: (movieId: number) => apiFetch<void>(`/ratings/${movieId}`, { method: "DELETE" }),
  },
  reviews: {
    list: (movieId?: number) => apiFetch<Review[]>(withQuery("/reviews", { movie_id: movieId })),
    create: (movieId: number, content: string) =>
      apiFetch<Review>("/reviews", { method: "POST", body: JSON.stringify({ movie_id: movieId, content }) }),
    update: (reviewId: number, content: string) =>
      apiFetch<Review>(`/reviews/${reviewId}`, { method: "PUT", body: JSON.stringify({ content }) }),
    remove: (reviewId: number) => apiFetch<void>(`/reviews/${reviewId}`, { method: "DELETE" }),
  },
  watchlist: {
    list: (sort = "newest") => apiFetch<LibraryItem[]>(withQuery("/watchlist", { sort })),
    status: (movieId: number) => apiFetch<{ exists: boolean }>(`/watchlist/${movieId}`),
    add: (movieId: number) =>
      apiFetch<LibraryItem>("/watchlist", { method: "POST", body: JSON.stringify({ movie_id: movieId }) }),
    remove: (movieId: number) => apiFetch<void>(`/watchlist/${movieId}`, { method: "DELETE" }),
  },
  favorites: {
    list: () => apiFetch<LibraryItem[]>("/favorites"),
    status: (movieId: number) => apiFetch<{ exists: boolean }>(`/favorites/${movieId}`),
    add: (movieId: number) =>
      apiFetch<LibraryItem>("/favorites", { method: "POST", body: JSON.stringify({ movie_id: movieId }) }),
    remove: (movieId: number) => apiFetch<void>(`/favorites/${movieId}`, { method: "DELETE" }),
  },
  diary: {
    list: () => apiFetch<DiaryEntry[]>("/diary"),
    create: (payload: { movie_id: number; watch_date: string; rating?: number | null; notes?: string }) =>
      apiFetch<DiaryEntry>("/diary", { method: "POST", body: JSON.stringify(payload) }),
    update: (entryId: number, payload: Partial<{ watch_date: string; rating: number | null; notes: string }>) =>
      apiFetch<DiaryEntry>(`/diary/${entryId}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (entryId: number) => apiFetch<void>(`/diary/${entryId}`, { method: "DELETE" }),
  },
  lists: {
    list: () => apiFetch<MovieList[]>("/lists"),
    create: (payload: { name: string; description?: string }) =>
      apiFetch<MovieList>("/lists", { method: "POST", body: JSON.stringify(payload) }),
    get: (listId: number) => apiFetch<MovieList>(`/lists/${listId}`),
    update: (listId: number, payload: Partial<{ name: string; description: string }>) =>
      apiFetch<MovieList>(`/lists/${listId}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (listId: number) => apiFetch<void>(`/lists/${listId}`, { method: "DELETE" }),
    addMovie: (listId: number, movieId: number) =>
      apiFetch<MovieList>(`/lists/${listId}/movies`, { method: "POST", body: JSON.stringify({ movie_id: movieId }) }),
    removeMovie: (listId: number, movieId: number) =>
      apiFetch<MovieList>(`/lists/${listId}/movies/${movieId}`, { method: "DELETE" }),
    reorder: (listId: number, movieIds: number[]) =>
      apiFetch<MovieList>(`/lists/${listId}/reorder`, { method: "PUT", body: JSON.stringify({ movie_ids: movieIds }) }),
  },
  statistics: () => apiFetch<Statistics>("/statistics"),
}
