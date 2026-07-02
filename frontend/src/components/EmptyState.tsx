import { Film } from "lucide-react"

type EmptyStateProps = {
  title: string
  message: string
}

export default function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="glass-panel rounded-lg p-8 text-center">
      <Film className="mx-auto mb-4 text-white/45" size={36} />
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">{message}</p>
    </div>
  )
}
