import { AlertTriangle } from "lucide-react"

type ErrorBannerProps = {
  message: string
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div role="alert" className="rounded-lg border border-coral/30 bg-coral/10 p-4 text-sm text-coral">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0" size={18} />
        <p>{message}</p>
      </div>
    </div>
  )
}
