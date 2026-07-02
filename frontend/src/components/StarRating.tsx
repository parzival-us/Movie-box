type StarRatingProps = {
  value?: number | null
  onChange?: (value: number) => void
  size?: "sm" | "md" | "lg"
  readOnly?: boolean
}

const sizeClass = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
}

export default function StarRating({ value = 0, onChange, size = "md", readOnly = false }: StarRatingProps) {
  const rating = value ?? 0
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const starNumber = index + 1
        const fillPercent = Math.max(0, Math.min(1, rating - index)) * 100
        return (
          <span key={starNumber} className={`relative inline-flex leading-none ${sizeClass[size]}`}>
            <span className="text-white/20">★</span>
            <span className="absolute left-0 top-0 overflow-hidden text-ember" style={{ width: `${fillPercent}%` }}>
              ★
            </span>
            {!readOnly && (
              <>
                <button
                  type="button"
                  className="absolute left-0 top-0 h-full w-1/2"
                  aria-label={`Rate ${index + 0.5} stars`}
                  onClick={() => onChange?.(index + 0.5)}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full w-1/2"
                  aria-label={`Rate ${starNumber} stars`}
                  onClick={() => onChange?.(starNumber)}
                />
              </>
            )}
          </span>
        )
      })}
    </div>
  )
}
