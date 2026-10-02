import { CheckCircle2, PackageCheck, PackageOpen, Truck, XCircle, type LucideIcon } from 'lucide-react'
import type { OrderStatus } from '@/types'

export const orderStatusIcon: Record<OrderStatus, LucideIcon> = {
  CONFIRMED: CheckCircle2,
  IN_PROGRESS: PackageOpen,
  DISPATCHED: Truck,
  OUT_OF_DELIVERY: Truck,
  DELIVERED: PackageCheck,
  CANCELLED: XCircle,
}
