export default function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2/3] rounded-lg bg-white/10" />
      <div className="mt-3 h-4 w-4/5 rounded bg-white/10" />
      <div className="mt-2 h-3 w-2/5 rounded bg-white/10" />
    </div>
  )
}
