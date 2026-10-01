import { ImageOff } from 'lucide-react'
import { useState, type ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** <img> that swaps to a neutral placeholder if the URL fails to load. */
export function ImageWithFallback({ className, alt, src, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failedSrc, setFailedSrc] = useState<string>()
  if (!src || failedSrc === src) {
    return (
      <div className={cn('flex items-center justify-center bg-muted text-muted-foreground', className)} role="img" aria-label={alt}>
        <ImageOff className="size-6 opacity-60" />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={cn('bg-muted object-cover', className)}
      {...props}
    />
  )
}
