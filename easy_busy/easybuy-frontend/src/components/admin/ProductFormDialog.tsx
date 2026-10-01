import { Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { formatPrice } from '@/lib/format'
import { effectivePrice } from '@/lib/pricing'
import { useProductStore } from '@/stores/productStore'
import type { Product, ProductInput } from '@/types'

interface FormState {
  title: string
  brand: string
  shortDesc: string
  longDesc: string
  price: string
  discount: string
  categoryId: string
  images: string
  live: boolean
  featured: boolean
}

const empty: FormState = {
  title: '', brand: '', shortDesc: '', longDesc: '', price: '', discount: '0',
  categoryId: '', images: '', live: true, featured: false,
}

const fromProduct = (p: Product): FormState => ({
  title: p.title,
  brand: p.brand ?? '',
  shortDesc: p.shortDesc,
  longDesc: p.longDesc,
  price: String(p.price),
  discount: String(p.discount),
  categoryId: String(p.categories[0]?.id ?? ''),
  images: p.productImages.join('\n'),
  live: p.live,
  featured: p.featured ?? false,
})

type Errors = Partial<Record<keyof FormState, string>>

// Mirrors the bean-validation rules on ProductDto
function validate(f: FormState): Errors {
  const e: Errors = {}
  if (!f.title.trim()) e.title = 'Title is required'
  if (!f.shortDesc.trim()) e.shortDesc = 'Short description is required'
  else if (f.shortDesc.length > 500) e.shortDesc = 'Must be at most 500 characters'
  if (!f.longDesc.trim()) e.longDesc = 'Description is required'
  if (!(Number(f.price) > 0)) e.price = 'Price must be greater than 0'
  const d = Number(f.discount)
  if (!Number.isInteger(d) || d < 0 || d > 100) e.discount = 'Discount must be 0–100'
  if (!f.categoryId) e.categoryId = 'Select a category'
  return e
}

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const { categories, fetchCategories, createProduct, updateProduct } = useProductStore()
  const [form, setForm] = useState<FormState>(empty)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const editing = !!product

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    if (open) {
      setForm(product ? fromProduct(product) : empty)
      setErrors({})
    }
  }, [open, product])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const imageList = form.images.split('\n').map((s) => s.trim()).filter(Boolean)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return

    const category = categories.find((c) => String(c.id) === form.categoryId)!
    const input: ProductInput = {
      title: form.title.trim(),
      brand: form.brand.trim() || undefined,
      shortDesc: form.shortDesc.trim(),
      longDesc: form.longDesc.trim(),
      price: Number(form.price),
      discount: Number(form.discount),
      live: form.live,
      featured: form.featured,
      productImages: imageList,
      categories: [{ id: category.id, title: category.title }],
      rating: product?.rating ?? 0,
      reviewCount: product?.reviewCount ?? 0,
      soldCount: product?.soldCount ?? 0,
    }

    setSaving(true)
    try {
      if (editing) {
        await updateProduct(product.id, input)
        toast.success('Product updated', { description: input.title })
      } else {
        await createProduct(input)
        toast.success('Product created', { description: 'Set its stock level from Inventory.' })
      }
      onOpenChange(false)
    } catch (err) {
      toast.error('Could not save product', { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  const err = (k: keyof FormState) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit product' : 'Add product'}</DialogTitle>
          <DialogDescription>{editing ? 'Update product details shown in the store.' : 'Create a new product in your catalogue.'}</DialogDescription>
        </DialogHeader>

        <form id="product-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="title">Product name</Label>
            <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} aria-invalid={!!errors.title} />
            {err('title')}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select value={form.categoryId} onValueChange={(v) => set('categoryId', v)}>
              <SelectTrigger id="category" className="w-full" aria-invalid={!!errors.categoryId}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {err('categoryId')}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price">Price (MRP, ₹)</Label>
            <Input id="price" type="number" min={1} value={form.price} onChange={(e) => set('price', e.target.value)} aria-invalid={!!errors.price} />
            {err('price')}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discount">Discount (%)</Label>
            <Input id="discount" type="number" min={0} max={100} value={form.discount} onChange={(e) => set('discount', e.target.value)} aria-invalid={!!errors.discount} />
            {err('discount')}
          </div>
          {Number(form.price) > 0 && (
            <p className="-mt-2 text-xs text-muted-foreground sm:col-span-2">
              Selling price: <span className="font-medium text-foreground">{formatPrice(effectivePrice(Number(form.price), Number(form.discount) || 0))}</span>
            </p>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="shortDesc">Short description</Label>
            <Input id="shortDesc" value={form.shortDesc} onChange={(e) => set('shortDesc', e.target.value)} aria-invalid={!!errors.shortDesc} />
            {err('shortDesc')}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="longDesc">Full description</Label>
            <Textarea id="longDesc" rows={4} value={form.longDesc} onChange={(e) => set('longDesc', e.target.value)} aria-invalid={!!errors.longDesc} />
            {err('longDesc')}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="images">Image URLs (one per line)</Label>
            <Textarea id="images" rows={3} value={form.images} onChange={(e) => set('images', e.target.value)} placeholder="https://…" className="font-mono text-xs" />
            {imageList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {imageList.map((src) => <ImageWithFallback key={src} src={src} alt="" className="size-16 rounded-md border" />)}
              </div>
            )}
          </div>
          <Label className="flex items-center justify-between gap-3 rounded-lg border p-3 font-normal">
            <div>
              <div className="font-medium">Live</div>
              <div className="text-xs text-muted-foreground">Visible in the storefront</div>
            </div>
            <Switch checked={form.live} onCheckedChange={(v) => set('live', v)} />
          </Label>
          <Label className="flex items-center justify-between gap-3 rounded-lg border p-3 font-normal">
            <div>
              <div className="font-medium">Featured</div>
              <div className="text-xs text-muted-foreground">Show on the home page</div>
            </div>
            <Switch checked={form.featured} onCheckedChange={(v) => set('featured', v)} />
          </Label>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button type="submit" form="product-form" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {editing ? 'Save changes' : 'Create product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
