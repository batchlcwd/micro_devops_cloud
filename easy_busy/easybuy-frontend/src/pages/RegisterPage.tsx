import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { errorMessage } from '@/lib/http'
import { useAuthStore } from '@/stores/authStore'

interface FormState {
  name: string
  email: string
  phoneNumber: string
  password: string
  confirm: string
}

type Errors = Partial<Record<keyof FormState, string>>

function validate(f: FormState): Errors {
  const e: Errors = {}
  if (f.name.trim().length < 2) e.name = 'Enter your name'
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email'
  if (f.phoneNumber && !/^\+?\d{10,13}$/.test(f.phoneNumber)) e.phoneNumber = 'Enter a valid phone number'
  if (f.password.length < 6) e.password = 'Use at least 6 characters'
  if (f.confirm !== f.password) e.confirm = 'Passwords do not match'
  return e
}

/** POST /users/api/users, then signs in. New accounts get the GUEST role. */
export function RegisterPage() {
  useDocumentTitle('Create account')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const register = useAuthStore((s) => s.register)
  const [form, setForm] = useState<FormState>({ name: '', email: '', phoneNumber: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState('')
  const [pending, setPending] = useState(false)

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    setServerError('')
    if (Object.keys(errs).length) return
    setPending(true)
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber || undefined,
      })
      toast.success(`Welcome to EasyBuy, ${user.name.split(' ')[0]}!`)
      navigate(params.get('redirect') ?? '/', { replace: true })
    } catch (err) {
      setServerError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  const field = (k: keyof FormState, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  )

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Logo className="mb-8" />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Shop faster and track your orders</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} noValidate className="space-y-4">
            {field('name', 'Full name', { autoComplete: 'name' })}
            {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
            {field('phoneNumber', 'Mobile number (optional)', { type: 'tel', autoComplete: 'tel' })}
            {field('password', 'Password', { type: 'password', autoComplete: 'new-password' })}
            {field('confirm', 'Confirm password', { type: 'password', autoComplete: 'new-password' })}
            {serverError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{serverError}</p>}
            <Button type="submit" className="h-10 w-full" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} Create account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Already have an account?&nbsp;
          <Link to={`/login${params.get('redirect') ? `?redirect=${encodeURIComponent(params.get('redirect')!)}` : ''}`} className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
