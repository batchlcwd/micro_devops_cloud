import { Eye, MoreHorizontal, PackageSearch, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ProductFormDialog } from '@/components/admin/ProductFormDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { PageHeader } from '@/components/common/PageHeader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatPrice } from '@/lib/format'
import { effectivePrice } from '@/lib/pricing'
import { useProductStore } from '@/stores/productStore'
import type { Product } from '@/types'

export function AdminProductsPage() {
  useDocumentTitle('Products')
  const { adminProducts, adminLoading, categories, fetchAdminProducts, fetchCategories, updateProduct, deleteProduct } = useProductStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  useEffect(() => {
    fetchAdminProducts()
    fetchCategories()
  }, [fetchAdminProducts, fetchCategories])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return adminProducts.filter(
      (p) =>
        (!q || `${p.title} ${p.brand ?? ''}`.toLowerCase().includes(q)) &&
        (category === 'all' || p.categories.some((c) => String(c.id) === category)) &&
        (status === 'all' || (status === 'live' ? p.live : !p.live)),
    )
  }, [adminProducts, search, category, status])

  async function toggleLive(p: Product) {
    const { id, createdAt: _c, updatedAt: _u, reviews: _r, ...input } = p
    await updateProduct(id, { ...input, live: !p.live })
    toast.success(p.live ? 'Product hidden from store' : 'Product is now live', { description: p.title })
  }

  async function confirmDelete() {
    if (!deleting) return
    await deleteProduct(deleting.id)
    toast.success('Product deleted', { description: deleting.title })
    setDeleting(null)
  }

  return (
    <>
      <PageHeader
        title="Products"
        description={`${adminProducts.length} products in catalogue`}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus data-icon="inline-start" /> Add product
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or brand…" className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="draft">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="hidden text-right md:table-cell">Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 pr-4"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminLoading && adminProducts.length === 0 ? (
                Array.from({ length: 6 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="px-4"><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-6">
                    <EmptyState icon={PackageSearch} title="No products match" description="Try a different search or filter." className="border-0 py-8" />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback src={p.productImages[0]} alt="" className="size-11 shrink-0 rounded-md border" />
                        <div className="min-w-0">
                          <div className="max-w-xs truncate font-medium">{p.title}</div>
                          <div className="text-xs text-muted-foreground">{p.brand ?? '—'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{p.categories[0]?.title ?? 'Uncategorised'}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div className="font-medium">{formatPrice(effectivePrice(p.price, p.discount))}</div>
                      {p.discount > 0 && <div className="text-xs text-muted-foreground line-through">{formatPrice(p.price)}</div>}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">{p.discount}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={p.live} onCheckedChange={() => toggleLive(p)} aria-label={`Toggle ${p.title} live`} />
                        <span className="text-xs text-muted-foreground">{p.live ? 'Live' : 'Hidden'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Product actions"><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(p); setFormOpen(true) }}>
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          {p.live && (
                            <DropdownMenuItem asChild>
                              <Link to={`/products/${p.id}`} target="_blank"><Eye /> View in store</Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleting(p)}>
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” and its inventory record will be permanently removed. Existing orders are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>Delete product</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
