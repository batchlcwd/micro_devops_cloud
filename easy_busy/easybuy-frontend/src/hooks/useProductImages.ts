import { useEffect, useState } from 'react'
import { productService } from '@/services'

/** Map of productId → first image, for order/cart lines whose DTOs don't include images. */
export function useProductImages(productIds: string[]) {
  const key = [...new Set(productIds)].sort().join(',')
  const [images, setImages] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    if (!key) return
    let active = true
    productService.getMany(key.split(',')).then((map) => {
      if (!active) return
      const next: Record<string, string | undefined> = {}
      map.forEach((p, id) => (next[id] = p.productImages?.[0]))
      setImages(next)
    })
    return () => {
      active = false
    }
  }, [key])

  return images
}
