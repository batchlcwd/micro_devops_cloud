import { AlertTriangle, Boxes, PackagePlus, PackageCheck, PackageX, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CreateStockDialog } from '@/components/admin/CreateStockDialog'
import { UpdateStockDialog } from '@/components/admin/UpdateStockDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { PageHeader } from '@/components/common/PageHeader'
import { StockBadge } from '@/components/common/StatusBadges'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/lib/format'
import { stockStatus } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useProductStore } from '@/stores/productStore'
import type { InventoryItem, Product } from '@/types'

type Filter = 'all' | 'low' | 'out'

export function AdminInventoryPage() {
  useDocumentTitle('Inventory')
  const [params, setParams] = useSearchParams()
  const filter = (params.get('filter') as Filter) || 'all'
  const { items, loading, error, fetchInventory } = useInventoryStore()
  const { adminProducts, fetchAdminProducts } = useProductStore()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [creatingFor, setCreatingFor] = useState<Product | null>(null)

  useEffect(() => {
    fetchInventory()
    if (useProductStore.getState().adminProducts.length === 0) fetchAdminProducts().catch(() => {})
  }, [fetchInventory, fetchAdminProducts])

  const counts = useMemo(
    () => ({
      all: items.length,
      in: items.filter((i) => stockStatus(i) === 'IN_STOCK').length,
      low: items.filter((i) => stockStatus(i) === 'LOW_STOCK').length,
      out: items.filter((i) => stockStatus(i) === 'OUT_OF_STOCK').length,
    }),
    [items],
  )

  // Products without an inventory row (inventory-service doesn't create them automatically)
  const untracked = useMemo(
    () => (error ? [] : adminProducts.filter((p) => !items.some((i) => i.productId === p.id))),
    [adminProducts, items, error],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) => {
      const s = stockStatus(i)
      if (filter === 'low' && s !== 'LOW_STOCK') return false
      if (filter === 'out' && s !== 'OUT_OF_STOCK') return false
      return !q || `${i.productName} ${i.sku}`.toLowerCase().includes(q)
    })
  }, [items, filter, search])

  const imageFor = (productId: string) => adminProducts.find((p) => p.id === productId)?.productImages?.[0]

  const summary = [
    { label: 'Total SKUs', value: counts.all, icon: Boxes, tone: 'text-foreground' },
    { label: 'In stock', value: counts.in, icon: PackageCheck, tone: 'text-emerald-600' },
    { label: 'Low stock', value: counts.low, icon: AlertTriangle, tone: 'text-amber-600' },
    { label: 'Out of stock', value: counts.out, icon: PackageX, tone: 'text-red-600' },
  ]

  return (
    <>
      <PageHeader title="Inventory" description="Monitor and update stock levels across warehouses" />

      {!loading && untracked.length > 0 && (
        <Card className="mb-6 border-amber-300 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/5">
          <div className="px-4">
            <div className="flex items-center gap-2 font-medium">
              <PackagePlus className="size-4 text-amber-600" />
              {untracked.length} product{untracked.length === 1 ? ' has' : 's have'} no stock record
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Checkout fails for these products because stock can't be reserved. Create a record to start selling them.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {untracked.map((p) => (
                <Button key={p.id} variant="outline" size="sm" onClick={() => setCreatingFor(p)}>
                  <PackagePlus data-icon="inline-start" /> {p.title}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} size="sm">
            <div className="flex items-center gap-3 px-4">
              <Icon className={cn('size-5', tone)} />
              <div>
                <div className="text-xl font-semibold tabular-nums">{loading && items.length === 0 ? '–' : value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={filter} onValueChange={(v) => setParams(v === 'all' ? {} : { filter: v })}>
            <TabsList>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="low">Low ({counts.low})</TabsTrigger>
              <TabsTrigger value="out">Out ({counts.out})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or SKU…" className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Product</TableHead>
                <TableHead className="hidden lg:table-cell">Warehouse</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="hidden text-right md:table-cell">Reserved</TableHead>
                <TableHead className="hidden text-right md:table-cell">Reorder at</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden xl:table-cell">Updated</TableHead>
                <TableHead className="pr-4 text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-6">
                    <ErrorState message={error} onRetry={fetchInventory} className="border-0 py-8" />
                  </TableCell>
                </TableRow>
              ) : loading && items.length === 0 ? (
                Array.from({ length: 8 }, (_, i) => (
                  <TableRow key={i}><TableCell colSpan={8} className="px-4"><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-6">
                    <EmptyState icon={PackageCheck} title="Nothing to show" description="No inventory records match this filter." className="border-0 py-8" />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((i) => {
                  const status = stockStatus(i)
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <ImageWithFallback src={imageFor(i.productId)} alt="" className="size-10 shrink-0 rounded-md border" />
                          <div className="min-w-0">
                            <div className="max-w-xs truncate font-medium">{i.productName}</div>
                            <div className="font-mono text-xs text-muted-foreground">{i.sku}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{i.warehouseLocation}</TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-semibold tabular-nums',
                          status === 'OUT_OF_STOCK' && 'text-red-600',
                          status === 'LOW_STOCK' && 'text-amber-600',
                        )}
                      >
                        {i.availableQuantity}
                      </TableCell>
                      <TableCell className="hidden text-right text-muted-foreground tabular-nums md:table-cell">{i.reservedQuantity}</TableCell>
                      <TableCell className="hidden text-right text-muted-foreground tabular-nums md:table-cell">{i.reorderLevel}</TableCell>
                      <TableCell><StockBadge status={status} /></TableCell>
                      <TableCell className="hidden text-muted-foreground xl:table-cell">{i.updatedAt ? formatDate(i.updatedAt) : '—'}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button variant={status === 'IN_STOCK' ? 'outline' : 'default'} size="sm" onClick={() => setEditing(i)}>
                          {status === 'OUT_OF_STOCK' ? 'Restock' : 'Update'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <UpdateStockDialog item={editing} onOpenChange={(o) => !o && setEditing(null)} />
      <CreateStockDialog product={creatingFor} onOpenChange={(o) => !o && setCreatingFor(null)} />
    </>
  )
}
