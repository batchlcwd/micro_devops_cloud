import { CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from './EmptyState'

/** Shown when a request to the backend fails. */
export function ErrorState({ message, onRetry, className }: { message?: string; onRetry?: () => void; className?: string }) {
  return (
    <EmptyState
      icon={CloudOff}
      title="Something went wrong"
      description={message ?? 'We could not load this right now.'}
      action={onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
      className={className}
    />
  )
}
