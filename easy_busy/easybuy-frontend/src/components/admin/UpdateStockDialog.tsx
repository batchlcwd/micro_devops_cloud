import { Loader2, Minus, Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { StockBadge } from '@/components/common/StatusBadges'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorMessage } from '@/lib/http'
import { stockStatus } from '@/lib/pricing'
import { useInventoryStore } from '@/stores/inventoryStore'
import type { InventoryItem } from '@/types'

interface UpdateStockDialogProps {
  item: InventoryItem | null
  onOpenChange: (open: boolean) => void
}

export function UpdateStockDialog({ item, onOpenChange }: UpdateStockDialogProps) {
  const updateStock = useInventoryStore((s) => s.updateStock)
  const [quantity, setQuantity] = useState('0')
  const [reorder, setReorder] = useState('10')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setQuantity(String(item.availableQuantity))
      setReorder(String(item.reorderLevel))
    }
  }, [item])

  const qty = Math.max(0, Math.floor(Number(quantity) || 0))
  const reorderLevel = Math.max(0, Math.floor(Number(reorder) || 0))
  const delta = item ? qty - item.availableQuantity : 0

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!item) return
    setSaving(true)
    try {
      await updateStock(item, qty, reorderLevel)
      toast.success('Stock updated', { description: `${item.productName}: ${qty} units available` })
      onOpenChange(false)
    } catch (err) {
      toast.error('Could not update stock', { description: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update stock</DialogTitle>
          <DialogDescription className="line-clamp-1">{item?.productName} · {item?.sku}</DialogDescription>
        </DialogHeader>
        <form id="stock-form" onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="qty">Available quantity</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(String(Math.max(0, qty - 1)))} aria-label="Decrease"><Minus /></Button>
              <Input id="qty" type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="text-center tabular-nums" />
              <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(String(qty + 1))} aria-label="Increase"><Plus /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[10, 25, 50, 100].map((n) => (
                <Button key={n} type="button" variant="secondary" size="xs" onClick={() => setQuantity(String(qty + n))}>+{n}</Button>
              ))}
            </div>
            {item && item.reservedQuantity > 0 && (
              <p className="text-xs text-muted-foreground">{item.reservedQuantity} more units are reserved by open orders.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reorder">Reorder level</Label>
            <Input id="reorder" type="number" min={0} value={reorder} onChange={(e) => setReorder(e.target.value)} />
            <p className="text-xs text-muted-foreground">Products at or below this level are flagged as low stock.</p>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">
              Change: <span className={delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : delta < 0 ? 'text-destructive' : ''}>{delta > 0 ? `+${delta}` : delta}</span>
            </span>
            <StockBadge status={stockStatus({ availableQuantity: qty, reorderLevel })} />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button type="submit" form="stock-form" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />} Save stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
