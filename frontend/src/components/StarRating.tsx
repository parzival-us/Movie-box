type StarRatingProps = {
  value?: number | null
  onChange?: (value: number | null) => void
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

  function handleClick(newValue: number) {
    if (rating === newValue) {
      onChange?.(null)
    } else {
      onChange?.(newValue)
    }
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label={`Rating: ${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const starNumber = index + 1
        const fillPercent = Math.max(0, Math.min(1, rating - index)) * 100
        return (
          <span key={starNumber} className={`relative inline-flex leading-none ${sizeClass[size]}`}>
            <span className="text-white/15">★</span>
            <span className="absolute left-0 top-0 overflow-hidden text-white" style={{ width: `${fillPercent}%` }}>
              ★
            </span>
            {!readOnly && (
              <>
                <button
                  type="button"
                  className="absolute left-0 top-0 h-full w-1/2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1 focus-visible:ring-offset-black rounded-sm"
                  aria-label={`Rate ${index + 0.5} stars`}
                  onClick={() => handleClick(index + 0.5)}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full w-1/2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1 focus-visible:ring-offset-black rounded-sm"
                  aria-label={`Rate ${starNumber} stars`}
                  onClick={() => handleClick(starNumber)}
                />
              </>
            )}
          </span>
        )
      })}
    </div>
  )
}
