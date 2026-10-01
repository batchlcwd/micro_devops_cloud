import { Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorMessage } from '@/lib/http'
import { inventoryService } from '@/services'
import { useInventoryStore } from '@/stores/inventoryStore'
import type { Product } from '@/types'

/** POST /api/inventories for a product that has no stock record yet. */
export function CreateStockDialog({ product, onOpenChange }: { product: Product | null; onOpenChange: (open: boolean) => void }) {
  const fetchInventory = useInventoryStore((s) => s.fetchInventory)
  const [sku, setSku] = useState('')
  const [quantity, setQuantity] = useState('50')
  const [reorder, setReorder] = useState('10')
  const [warehouse, setWarehouse] = useState('BLR-WH-01')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product) setSku(`EB-${(product.categories?.[0]?.title ?? 'GEN').slice(0, 3).toUpperCase()}-${product.id.slice(0, 8).toUpperCase()}`)
  }, [product])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!product) return
    setSaving(true)
    try {
      await inventoryService.create({
        productId: product.id,
        sku: sku.trim(),
        productName: product.title,
        warehouseLocation: warehouse.trim(),
        availableQuantity: Math.max(0, Math.floor(Number(quantity) || 0)),
        reorderLevel: Math.max(0, Math.floor(Number(reorder) || 0)),
        active: product.live,
      })
      toast.success('Stock record created', { description: product.title })
      await fetchInventory()
      onOpenChange(false)
    } catch (err) {
      toast.error('Could not create stock record', { description: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!product} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create stock record</DialogTitle>
          <DialogDescription className="line-clamp-1">{product?.title}</DialogDescription>
        </DialogHeader>
        <form id="create-stock-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} required className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cs-qty">Available quantity</Label>
            <Input id="cs-qty" type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cs-reorder">Reorder level</Label>
            <Input id="cs-reorder" type="number" min={0} value={reorder} onChange={(e) => setReorder(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cs-wh">Warehouse</Label>
            <Input id="cs-wh" value={warehouse} onChange={(e) => setWarehouse(e.target.value)} required />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button type="submit" form="create-stock-form" disabled={saving || !sku.trim() || !warehouse.trim()}>
            {saving && <Loader2 className="animate-spin" />} Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
