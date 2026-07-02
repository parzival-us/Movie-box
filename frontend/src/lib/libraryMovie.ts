import type { LibraryItem, MovieSummary } from "../types"

export function libraryMovie(item: LibraryItem): MovieSummary {
  return item.movie ?? { id: item.movie_id, title: `Movie ${item.movie_id}` }
}
