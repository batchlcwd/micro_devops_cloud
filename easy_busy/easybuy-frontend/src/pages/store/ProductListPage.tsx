import { PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatPrice } from '@/lib/format'
import { productService } from '@/services'
import { useProductStore } from '@/stores/productStore'
import type { ProductSort } from '@/types'

const PRICE_MAX = 150000
const PAGE_SIZE = 12

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest first' },
  { value: 'rating', label: 'Customer rating' },
]

function pageList(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const pages = new Set([0, total - 1, current - 1, current, current + 1].filter((p) => p >= 0 && p < total))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['gap' as const, p] : [p]))
}

interface FiltersProps {
  categoryId?: number
  priceRange: [number, number]
  onCategory: (id?: number) => void
  onPrice: (range: [number, number]) => void
  onPriceCommit: (range: [number, number]) => void
}

function Filters({ categoryId, priceRange, onCategory, onPrice, onPriceCommit }: FiltersProps) {
  const categories = useProductStore((s) => s.categories)
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Category</h3>
        <RadioGroup value={categoryId ? String(categoryId) : 'all'} onValueChange={(v) => onCategory(v === 'all' ? undefined : Number(v))}>
          <Label className="flex cursor-pointer items-center gap-2 font-normal">
            <RadioGroupItem value="all" /> All categories
          </Label>
          {categories.map((c) => (
            <Label key={c.id} className="flex cursor-pointer items-center gap-2 font-normal">
              <RadioGroupItem value={String(c.id)} /> {c.title}
            </Label>
          ))}
        </RadioGroup>
      </div>
      <Separator />
      <div>
        <h3 className="mb-4 text-sm font-semibold">Price range</h3>
        <Slider
          min={0}
          max={PRICE_MAX}
          step={500}
          value={priceRange}
          onValueChange={(v) => onPrice([v[0], v[1]])}
          onValueCommit={(v) => onPriceCommit([v[0], v[1]])}
        />
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{priceRange[1] >= PRICE_MAX ? `${formatPrice(PRICE_MAX)}+` : formatPrice(priceRange[1])}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            [0, 1000],
            [1000, 5000],
            [5000, 20000],
            [20000, PRICE_MAX],
          ].map(([min, max]) => (
            <Button
              key={min}
              size="xs"
              variant="outline"
              onClick={() => {
                onPrice([min, max])
                onPriceCommit([min, max])
              }}
            >
              {max >= PRICE_MAX ? `${formatPrice(min)}+` : `${formatPrice(min)}–${formatPrice(max)}`}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProductListPage() {
  const [params, setParams] = useSearchParams()
  const categories = useProductStore((s) => s.categories)

  const q = params.get('q') ?? ''
  const categoryId = params.get('category') ? Number(params.get('category')) : undefined
  const sort = (params.get('sort') as ProductSort) || 'popularity'
  const page = Math.max(0, Number(params.get('page') ?? 1) - 1)
  const minPrice = Number(params.get('min') ?? 0)
  const maxPrice = Number(params.get('max') ?? PRICE_MAX)

  const [searchInput, setSearchInput] = useState(q)
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice])
  const debouncedSearch = useDebounce(searchInput)

  const categoryName = categories.find((c) => c.id === categoryId)?.title
  useDocumentTitle(categoryName ?? (q ? `Search: ${q}` : 'Shop'))

  useEffect(() => setSearchInput(q), [q])
  useEffect(() => setPriceRange([minPrice, maxPrice]), [minPrice, maxPrice])

  function update(patch: Record<string, string | number | undefined>, resetPage = true) {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v === undefined || v === '' ? next.delete(k) : next.set(k, String(v))))
    if (resetPage) next.delete('page')
    setParams(next)
  }

  useEffect(() => {
    if (debouncedSearch.trim() !== q) update({ q: debouncedSearch.trim() || undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const { data, loading } = useAsync(
    () =>
      productService.getProducts({
        search: q,
        categoryId,
        sort,
        page,
        size: PAGE_SIZE,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice >= PRICE_MAX ? undefined : maxPrice,
      }),
    [q, categoryId, sort, page, minPrice, maxPrice],
  )

  const commitPrice = ([min, max]: [number, number]) =>
    update({ min: min > 0 ? min : undefined, max: max < PRICE_MAX ? max : undefined })

  const filterProps: FiltersProps = {
    categoryId,
    priceRange,
    onCategory: (id) => update({ category: id }),
    onPrice: setPriceRange,
    onPriceCommit: commitPrice,
  }

  const activeFilters = [
    q && { key: 'q', label: `"${q}"` },
    categoryName && { key: 'category', label: categoryName },
    (minPrice > 0 || maxPrice < PRICE_MAX) && {
      key: 'price',
      label: `${formatPrice(minPrice)} – ${maxPrice >= PRICE_MAX ? 'Any' : formatPrice(maxPrice)}`,
    },
  ].filter(Boolean) as { key: string; label: string }[]

  const goToPage = (p: number) => {
    update({ page: p + 1 }, false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{categoryName ?? 'All products'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading ? 'Loading products…' : `${data?.totalElements ?? 0} products found`}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Filters {...filterProps} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search in results…"
                className="h-9 pl-9"
                aria-label="Search products"
              />
            </div>
            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-9 lg:hidden">
                    <SlidersHorizontal data-icon="inline-start" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-6">
                    <Filters {...filterProps} />
                  </div>
                </SheetContent>
              </Sheet>
              <Select value={sort} onValueChange={(v) => update({ sort: v === 'popularity' ? undefined : v })}>
                <SelectTrigger className="w-full sm:w-52" aria-label="Sort by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      Sort: {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeFilters.map((f) => (
                <Badge key={f.key} variant="secondary" className="h-6 gap-1 pr-1">
                  {f.label}
                  <button
                    type="button"
                    aria-label={`Remove ${f.label} filter`}
                    className="rounded-full p-0.5 hover:bg-background"
                    onClick={() =>
                      f.key === 'price' ? update({ min: undefined, max: undefined }) : update({ [f.key]: undefined })
                    }
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <Button variant="link" size="xs" onClick={() => setParams(new URLSearchParams())}>
                Clear all
              </Button>
            </div>
          )}

          {!loading && data?.content.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              description="Try adjusting your search or filters to find what you're looking for."
              action={<Button onClick={() => setParams(new URLSearchParams())}>Clear filters</Button>}
            />
          ) : (
            <ProductGrid products={data?.content} loading={loading} skeletonCount={PAGE_SIZE} className="lg:grid-cols-3 xl:grid-cols-4" />
          )}

          {data && data.totalPages > 1 && (
            <Pagination className="mt-10">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={data.first}
                    className={data.first ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(e) => {
                      e.preventDefault()
                      goToPage(page - 1)
                    }}
                  />
                </PaginationItem>
                {pageList(page, data.totalPages).map((p, i) =>
                  p === 'gap' ? (
                    <PaginationItem key={`gap-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === page}
                        onClick={(e) => {
                          e.preventDefault()
                          goToPage(p)
                        }}
                      >
                        {p + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={data.last}
                    className={data.last ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(e) => {
                      e.preventDefault()
                      goToPage(page + 1)
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  )
}
