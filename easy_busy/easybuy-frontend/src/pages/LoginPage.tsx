import { Loader2, ShieldCheck, User } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types'

/** Demo sign-in: replace with a real form posting to users-service when auth is wired. */
export function LoginPage() {
  useDocumentTitle('Sign in')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const loginAs = useAuthStore((s) => s.loginAs)
  const [pending, setPending] = useState<UserRole | null>(null)

  async function signIn(role: UserRole) {
    setPending(role)
    try {
      const user = await loginAs(role)
      toast.success(`Welcome, ${user.name.split(' ')[0]}!`)
      const redirect = params.get('redirect')
      navigate(redirect ?? (role === 'ADMIN' ? '/admin' : '/'), { replace: true })
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <Logo className="mb-8" />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Sign in to EasyBuy</CardTitle>
          <CardDescription>Choose a demo account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="h-11 w-full" onClick={() => signIn('CUSTOMER')} disabled={!!pending}>
            {pending === 'CUSTOMER' ? <Loader2 className="animate-spin" /> : <User data-icon="inline-start" />}
            Continue as customer
          </Button>
          <Button variant="outline" className="h-11 w-full" onClick={() => signIn('ADMIN')} disabled={!!pending}>
            {pending === 'ADMIN' ? <Loader2 className="animate-spin" /> : <ShieldCheck data-icon="inline-start" />}
            Continue as admin
          </Button>
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Authentication is mocked. Real login will connect to users-service.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
