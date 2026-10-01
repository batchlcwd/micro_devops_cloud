import { Banknote, CreditCard, Loader2, Lock, MapPin, ShoppingCart } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { PriceBreakdown } from '@/components/checkout/PriceBreakdown'
import { EmptyState } from '@/components/common/EmptyState'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { demoAddress, indianStates } from '@/data/users'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRazorpayPayment } from '@/hooks/useRazorpayPayment'
import { formatPrice } from '@/lib/format'
import { effectivePrice } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { selectCartTotals, useCartStore } from '@/stores/cartStore'
import { useOrderStore } from '@/stores/orderStore'
import type { PaymentMethod, ShippingAddress } from '@/types'

type Errors = Partial<Record<keyof ShippingAddress, string>>

function validate(a: ShippingAddress): Errors {
  const e: Errors = {}
  if (a.fullName.trim().length < 3) e.fullName = 'Enter your full name'
  if (!/^[6-9]\d{9}$/.test(a.phone)) e.phone = 'Enter a valid 10-digit mobile number'
  if (!/^\S+@\S+\.\S+$/.test(a.email)) e.email = 'Enter a valid email address'
  if (a.line1.trim().length < 5) e.line1 = 'Enter your house / flat and street'
  if (!a.city.trim()) e.city = 'Enter your city'
  if (!a.state) e.state = 'Select your state'
  if (!/^\d{6}$/.test(a.pincode)) e.pincode = 'Enter a valid 6-digit PIN code'
  return e
}

function Field({ id, label, error, className, children }: { id: string; label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function CheckoutPage() {
  useDocumentTitle('Checkout')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clear)
  const totals = useCartStore(useShallow(selectCartTotals))
  const placeOrder = useOrderStore((s) => s.placeOrder)
  const { payForOrder, paying } = useRazorpayPayment()

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  })
  const [notes, setNotes] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('ONLINE')
  const [errors, setErrors] = useState<Errors>({})
  const [placing, setPlacing] = useState(false)

  if (!user) return <Navigate to="/login?redirect=/checkout" replace />

  if (items.length === 0 && !placing) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Nothing to check out"
          description="Your cart is empty. Add some products before checking out."
          action={<Button asChild><Link to="/products">Browse products</Link></Button>}
        />
      </div>
    )
  }

  const set = (key: keyof ShippingAddress) => (value: string) => {
    setAddress((a) => ({ ...a, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const errs = validate(address)
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast.error('Please fix the highlighted fields')
      document.getElementById(Object.keys(errs)[0])?.focus()
      return
    }

    setPlacing(true)
    try {
      const order = await placeOrder({
        userId: user!.id,
        shippingAddress: address,
        items,
        paymentMethod: method,
        extraInformation: notes || undefined,
      })
      if (method === 'OFFLINE') {
        toast.success('Order placed', { description: `Order ${order.orderNumber} will be paid on delivery.` })
      } else {
        await payForOrder(order)
      }
      // Order exists and stock is reserved — the cart has served its purpose
      clearCart()
      navigate(`/orders/${order.id}?placed=1`, { replace: true })
    } catch (err) {
      toast.error('Could not place order', { description: err instanceof Error ? err.message : undefined })
      setPlacing(false)
    }
  }

  const busy = placing || paying

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">Checkout</h1>
      <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="size-4" /> Shipping address</CardTitle>
              <CardDescription>Where should we deliver your order?</CardDescription>
              <CardAction>
                <Button type="button" variant="outline" size="sm" onClick={() => { setAddress(demoAddress); setErrors({}) }}>
                  Use saved address
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field id="fullName" label="Full name" error={errors.fullName}>
                <Input id="fullName" value={address.fullName} onChange={(e) => set('fullName')(e.target.value)} aria-invalid={!!errors.fullName} autoComplete="name" />
              </Field>
              <Field id="phone" label="Mobile number" error={errors.phone}>
                <Input id="phone" inputMode="numeric" maxLength={10} value={address.phone} onChange={(e) => set('phone')(e.target.value.replace(/\D/g, ''))} aria-invalid={!!errors.phone} autoComplete="tel-national" />
              </Field>
              <Field id="email" label="Email" error={errors.email} className="sm:col-span-2">
                <Input id="email" type="email" value={address.email} onChange={(e) => set('email')(e.target.value)} aria-invalid={!!errors.email} autoComplete="email" />
              </Field>
              <Field id="line1" label="Flat, house no., building, street" error={errors.line1} className="sm:col-span-2">
                <Input id="line1" value={address.line1} onChange={(e) => set('line1')(e.target.value)} aria-invalid={!!errors.line1} autoComplete="address-line1" />
              </Field>
              <Field id="line2" label="Area, landmark (optional)" className="sm:col-span-2">
                <Input id="line2" value={address.line2} onChange={(e) => set('line2')(e.target.value)} autoComplete="address-line2" />
              </Field>
              <Field id="city" label="City" error={errors.city}>
                <Input id="city" value={address.city} onChange={(e) => set('city')(e.target.value)} aria-invalid={!!errors.city} autoComplete="address-level2" />
              </Field>
              <Field id="pincode" label="PIN code" error={errors.pincode}>
                <Input id="pincode" inputMode="numeric" maxLength={6} value={address.pincode} onChange={(e) => set('pincode')(e.target.value.replace(/\D/g, ''))} aria-invalid={!!errors.pincode} autoComplete="postal-code" />
              </Field>
              <Field id="state" label="State" error={errors.state}>
                <Select value={address.state} onValueChange={set('state')}>
                  <SelectTrigger id="state" className="w-full" aria-invalid={!!errors.state}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="country" label="Country">
                <Input id="country" value={address.country} disabled />
              </Field>
              <Field id="notes" label="Delivery instructions (optional)" className="sm:col-span-2">
                <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Leave at the security desk" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="size-4" /> Payment</CardTitle>
              <CardDescription>All transactions are secure and encrypted.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} className="gap-3">
                <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-muted/40">
                  <RadioGroupItem value="ONLINE" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      Pay online with Razorpay
                      <span className="rounded bg-[#3395ff]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#3395ff]">RECOMMENDED</span>
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">UPI, credit / debit cards, net banking and wallets</div>
                  </div>
                  <CreditCard className="size-5 text-muted-foreground" />
                </Label>
                <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 font-normal has-data-[state=checked]:border-primary has-data-[state=checked]:bg-muted/40">
                  <RadioGroupItem value="OFFLINE" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">Cash on delivery</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">Pay with cash or UPI when your order arrives</div>
                  </div>
                  <Banknote className="size-5 text-muted-foreground" />
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative shrink-0">
                      <ImageWithFallback src={item.image} alt={item.title} className="size-16 rounded-md" />
                      <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm">{item.title}</div>
                    </div>
                    <div className="text-sm font-medium">{formatPrice(effectivePrice(item.price, item.discount) * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <Separator />
              <PriceBreakdown {...totals} />
              <Button type="submit" size="lg" className={cn('h-11 w-full', method === 'ONLINE' && 'bg-[#3395ff] text-white hover:bg-[#3395ff]/90')} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Lock data-icon="inline-start" />}
                {busy ? 'Processing…' : method === 'ONLINE' ? `Pay ${formatPrice(totals.total)} with Razorpay` : `Place order · ${formatPrice(totals.total)}`}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                By placing this order you agree to our Terms of Use and Privacy Policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
