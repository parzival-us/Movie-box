export const posterUrl = (path?: string | null, size = "w500") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined

export const backdropUrl = (path?: string | null, size = "w1280") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined

export const profileUrl = (path?: string | null, size = "w185") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined
