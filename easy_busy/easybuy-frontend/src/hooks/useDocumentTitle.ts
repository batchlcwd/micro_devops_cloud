import { useEffect } from 'react'

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · EasyBuy` : 'EasyBuy — Shop smarter'
  }, [title])
}
