export const yearFromDate = (date?: string) => (date ? date.slice(0, 4) : "TBA")

export const formatRuntime = (minutes?: number | null) => {
  if (minutes === undefined || minutes === null) return "Runtime TBA"
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return hours ? `${hours}h ${remaining}m` : `${remaining}m`
}

export const formatDate = (value?: string) => {
  if (!value) return "No date"
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
}

export const formatHours = (minutes: number) => `${Math.round((minutes / 60) * 10) / 10} hours`
