import { Building2, CreditCard, Loader2, ShieldCheck, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatPrice } from '@/lib/format'
import { useMockRazorpayStore } from '@/stores/mockRazorpayStore'

const banks = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank']

/**
 * Stand-in for Razorpay's hosted checkout modal. Rendered once in the store
 * layout; opened via `mockRazorpayGateway`. Not used when VITE_PAYMENT_GATEWAY=razorpay.
 */
export function MockRazorpayCheckout() {
  const { open, options, succeed, fail, dismiss } = useMockRazorpayStore()
  const [processing, setProcessing] = useState<'success' | 'failure' | null>(null)
  const [method, setMethod] = useState('upi')

  useEffect(() => {
    if (open) {
      setProcessing(null)
      setMethod('upi')
    }
  }, [open])

  if (!options) return null

  function process(outcome: 'success' | 'failure') {
    setProcessing(outcome)
    setTimeout(() => (outcome === 'success' ? succeed() : fail()), 1600)
  }

  const amount = formatPrice(options.amount / 100)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !processing && dismiss()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md" showCloseButton={!processing}>
        <div className="bg-[#0b1d3a] px-6 pt-6 pb-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white/10 font-bold">EB</div>
            <div className="min-w-0">
              <DialogTitle className="text-base text-white">{options.name}</DialogTitle>
              <DialogDescription className="truncate text-xs text-white/70">{options.description}</DialogDescription>
            </div>
            <Badge className="ml-auto border-0 bg-amber-400 text-amber-950">Test mode</Badge>
          </div>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <div className="text-xs text-white/60">Amount payable</div>
              <div className="text-2xl font-semibold">{amount}</div>
            </div>
            <div className="text-right text-xs text-white/60">
              <div>{options.prefill?.contact}</div>
              <div>{options.prefill?.email}</div>
            </div>
          </div>
        </div>

        {processing ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <Loader2 className="size-8 animate-spin text-[#3395ff]" />
            <div className="font-medium">Processing payment…</div>
            <p className="text-sm text-muted-foreground">Please do not close this window or press back.</p>
          </div>
        ) : (
          <div className="p-6">
            <Tabs value={method} onValueChange={setMethod}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upi"><Smartphone /> UPI</TabsTrigger>
                <TabsTrigger value="card"><CreditCard /> Card</TabsTrigger>
                <TabsTrigger value="netbanking"><Building2 /> Bank</TabsTrigger>
              </TabsList>
              <TabsContent value="upi" className="space-y-2 pt-4">
                <Label htmlFor="upi">UPI ID</Label>
                <Input id="upi" defaultValue="success@razorpay" />
                <p className="text-xs text-muted-foreground">Use any UPI ID — this is a simulated payment.</p>
              </TabsContent>
              <TabsContent value="card" className="space-y-3 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="card">Card number</Label>
                  <Input id="card" defaultValue="4111 1111 1111 1111" inputMode="numeric" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="exp">Expiry</Label>
                    <Input id="exp" defaultValue="12/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" defaultValue="123" type="password" />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="netbanking" className="pt-4">
                <RadioGroup defaultValue={banks[0]} className="grid grid-cols-2 gap-2">
                  {banks.map((b) => (
                    <Label key={b} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-normal has-data-[state=checked]:border-primary">
                      <RadioGroupItem value={b} /> {b}
                    </Label>
                  ))}
                </RadioGroup>
              </TabsContent>
            </Tabs>

            <Button className="mt-6 h-11 w-full bg-[#3395ff] text-white hover:bg-[#3395ff]/90" onClick={() => process('success')}>
              Pay {amount}
            </Button>
            <Button variant="link" className="mt-1 w-full text-muted-foreground" onClick={() => process('failure')}>
              Simulate a failed payment
            </Button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" /> Secured by Razorpay (mock)
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
