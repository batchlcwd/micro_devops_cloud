import type { Product, Review } from '@/types'
import { categories } from './categories'

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=75`

const cat = (id: number) => {
  const c = categories.find((x) => x.id === id)!
  return { id: c.id, title: c.title }
}

const sampleReviews: Review[] = [
  { id: 1, userName: 'Ananya S.', rating: 5, comment: 'Excellent quality, exactly as described. Delivery was quick too.', createdAt: '2026-08-14T10:20:00Z' },
  { id: 2, userName: 'Rahul M.', rating: 4, comment: 'Great value for money. Packaging could be better.', createdAt: '2026-08-02T15:45:00Z' },
  { id: 3, userName: 'Priya K.', rating: 5, comment: 'Using it daily for a month now — no complaints at all.', createdAt: '2026-07-21T08:05:00Z' },
]

interface Seed {
  n: number
  title: string
  brand: string
  shortDesc: string
  price: number
  discount: number
  category: number
  images: string[]
  rating: number
  reviewCount: number
  soldCount: number
  featured?: boolean
  live?: boolean
  daysAgo: number
}

const seeds: Seed[] = [
  { n: 1, title: 'Sony WH-1000XM5 Wireless Headphones', brand: 'Sony', shortDesc: 'Industry-leading noise cancellation with 30-hour battery life.', price: 34990, discount: 15, category: 1, images: ['photo-1505740420928-5e560c06d30e', 'photo-1484704849700-f032a568e944'], rating: 4.7, reviewCount: 2384, soldCount: 5400, featured: true, daysAgo: 40 },
  { n: 2, title: 'Apple Watch Series 10 GPS 46mm', brand: 'Apple', shortDesc: 'Thinner design, bigger display and advanced health sensors.', price: 49900, discount: 8, category: 1, images: ['photo-1579586337278-3befd40fd17a', 'photo-1546868871-7041f2a55e12'], rating: 4.8, reviewCount: 1520, soldCount: 4200, featured: true, daysAgo: 12 },
  { n: 3, title: 'MacBook Air 13" M3 Chip', brand: 'Apple', shortDesc: 'Strikingly thin laptop with all-day battery and Liquid Retina display.', price: 114900, discount: 10, category: 1, images: ['photo-1496181133206-80ce9b88a853', 'photo-1517336714731-489689fd1ca8'], rating: 4.9, reviewCount: 980, soldCount: 2100, featured: true, daysAgo: 60 },
  { n: 4, title: 'Samsung Galaxy S25 Ultra 256GB', brand: 'Samsung', shortDesc: 'Titanium frame, 200MP camera and built-in S Pen.', price: 129999, discount: 12, category: 1, images: ['photo-1511707171634-5f897ff02aa9', 'photo-1610945265064-0e34e5519bbf'], rating: 4.6, reviewCount: 1875, soldCount: 3900, daysAgo: 5 },
  { n: 5, title: 'Keychron K2 Mechanical Keyboard', brand: 'Keychron', shortDesc: 'Wireless 75% layout with hot-swappable Gateron switches.', price: 8999, discount: 20, category: 1, images: ['photo-1587829741301-dc798b83add3', 'photo-1618384887929-16ec33fab9ef'], rating: 4.5, reviewCount: 642, soldCount: 1800, daysAgo: 25 },
  { n: 6, title: 'JBL Flip 6 Portable Speaker', brand: 'JBL', shortDesc: 'Bold sound, IP67 waterproof and 12 hours of playtime.', price: 13999, discount: 30, category: 1, images: ['photo-1608043152269-423dbba4e7e1', 'photo-1545454675-3531b543be5d'], rating: 4.4, reviewCount: 3110, soldCount: 6800, daysAgo: 90 },
  { n: 7, title: 'Fujifilm Instax Mini 12 Camera', brand: 'Fujifilm', shortDesc: 'Instant camera with auto exposure and selfie mirror.', price: 7999, discount: 5, category: 1, images: ['photo-1526170375885-4d8ecf77b99f'], rating: 4.3, reviewCount: 455, soldCount: 900, daysAgo: 3 },
  { n: 8, title: 'Nike Air Zoom Pegasus 41', brand: 'Nike', shortDesc: 'Responsive everyday running shoe with ReactX foam.', price: 11895, discount: 18, category: 2, images: ['photo-1542291026-7eec264c27ff', 'photo-1608231387042-66d1773070a5'], rating: 4.6, reviewCount: 1240, soldCount: 5200, featured: true, daysAgo: 30 },
  { n: 9, title: 'Classic White Leather Sneakers', brand: 'Urban Step', shortDesc: 'Minimal low-top sneakers crafted from full-grain leather.', price: 4499, discount: 25, category: 2, images: ['photo-1549298916-b41d501d3772'], rating: 4.2, reviewCount: 388, soldCount: 1500, daysAgo: 8 },
  { n: 10, title: 'Essential Crew-Neck Cotton Tee', brand: 'Basics Co.', shortDesc: '100% organic cotton, relaxed fit, pre-shrunk.', price: 999, discount: 0, category: 2, images: ['photo-1521572163474-6864f9cf17ab'], rating: 4.1, reviewCount: 2210, soldCount: 9100, daysAgo: 120 },
  { n: 11, title: 'Ray-Ban Aviator Classic Sunglasses', brand: 'Ray-Ban', shortDesc: 'Iconic gold frame with polarized G-15 lenses.', price: 10490, discount: 10, category: 2, images: ['photo-1572635196237-14b3f281503f', 'photo-1511499767150-a48a237f0083'], rating: 4.7, reviewCount: 870, soldCount: 2600, daysAgo: 45 },
  { n: 12, title: 'Everyday Leather Tote Bag', brand: 'Hidesign', shortDesc: 'Spacious handcrafted tote with laptop sleeve.', price: 6995, discount: 22, category: 2, images: ['photo-1584917865442-de89df76afd3'], rating: 4.5, reviewCount: 314, soldCount: 820, daysAgo: 2 },
  { n: 13, title: 'Commuter Backpack 25L', brand: 'Wildcraft', shortDesc: 'Water-resistant daypack with padded 16" laptop compartment.', price: 3499, discount: 35, category: 2, images: ['photo-1553062407-98eeb64c6a62'], rating: 4.4, reviewCount: 1650, soldCount: 4700, daysAgo: 70 },
  { n: 14, title: 'Nordic Ceramic Table Lamp', brand: 'Casa Living', shortDesc: 'Matte ceramic base with linen shade and warm LED.', price: 3299, discount: 15, category: 3, images: ['photo-1507473885765-e6ed057f782c'], rating: 4.3, reviewCount: 210, soldCount: 640, daysAgo: 14 },
  { n: 15, title: 'Handmade Stoneware Mug Set (4)', brand: 'Clay Craft', shortDesc: 'Speckled glaze mugs, microwave & dishwasher safe.', price: 1499, discount: 10, category: 3, images: ['photo-1514228742587-6b1558fcca3d'], rating: 4.6, reviewCount: 530, soldCount: 2300, daysAgo: 6 },
  { n: 16, title: 'Fiddle Leaf Fig Indoor Plant', brand: 'Ugaoo', shortDesc: 'Air-purifying plant in a self-watering pot.', price: 1899, discount: 0, category: 3, images: ['photo-1485955900006-10f4d324d411'], rating: 4.2, reviewCount: 175, soldCount: 480, daysAgo: 1 },
  { n: 17, title: 'Velvet Accent Lounge Chair', brand: 'Urban Ladder', shortDesc: 'Mid-century silhouette with solid wood legs.', price: 18999, discount: 28, category: 3, images: ['photo-1567538096630-e0c55bd6374c', 'photo-1586023492125-27b2c045efd7'], rating: 4.5, reviewCount: 96, soldCount: 210, featured: true, daysAgo: 20 },
  { n: 18, title: 'Vitamin C Brightening Serum', brand: 'Minimalist', shortDesc: '10% vitamin C with ferulic acid for radiant skin.', price: 699, discount: 5, category: 4, images: ['photo-1556228578-8c89e6adf883', 'photo-1620916566398-39f1143ab7be'], rating: 4.3, reviewCount: 4120, soldCount: 12000, daysAgo: 50 },
  { n: 19, title: 'Eau de Parfum — Midnight Oud 100ml', brand: 'Maison Noir', shortDesc: 'Warm woody fragrance with notes of oud and amber.', price: 5499, discount: 20, category: 4, images: ['photo-1541643600914-78b084683601', 'photo-1592945403244-b3fbafd7f539'], rating: 4.6, reviewCount: 760, soldCount: 1900, featured: true, daysAgo: 10 },
  { n: 20, title: 'Premium Grooming Kit', brand: 'Beardo', shortDesc: 'Trimmer, beard oil and wash in a travel case.', price: 2999, discount: 30, category: 4, images: ['photo-1621607512214-68297480165e'], rating: 4.0, reviewCount: 290, soldCount: 880, daysAgo: 75 },
  { n: 21, title: 'Pro Yoga Mat 6mm', brand: 'Decathlon', shortDesc: 'Non-slip TPE mat with alignment lines and strap.', price: 1999, discount: 15, category: 5, images: ['photo-1601925260368-ae2f83cf8b7f'], rating: 4.5, reviewCount: 1430, soldCount: 5600, daysAgo: 35 },
  { n: 22, title: 'Adjustable Dumbbell Set 24kg', brand: 'Cockatoo', shortDesc: 'Quick-dial weight selection from 2.5kg to 24kg.', price: 15999, discount: 25, category: 5, images: ['photo-1583454110551-21f2fa2afe61'], rating: 4.4, reviewCount: 520, soldCount: 1100, daysAgo: 4, live: true },
  { n: 23, title: 'Atomic Habits — James Clear', brand: 'Penguin', shortDesc: 'An easy & proven way to build good habits and break bad ones.', price: 799, discount: 40, category: 6, images: ['photo-1544947950-fa07a98d237f'], rating: 4.8, reviewCount: 8900, soldCount: 25000, daysAgo: 200 },
  { n: 24, title: 'Clean Code — Robert C. Martin', brand: 'Pearson', shortDesc: 'A handbook of agile software craftsmanship.', price: 1299, discount: 20, category: 6, images: ['photo-1532012197267-da84d127e765'], rating: 4.7, reviewCount: 3100, soldCount: 7400, daysAgo: 150 },
  { n: 25, title: 'Smart LED Desk Lamp (Beta)', brand: 'Philips', shortDesc: 'App-controlled colour temperature with wireless charging base.', price: 4999, discount: 0, category: 3, images: ['photo-1534073828943-f801091bb18c'], rating: 0, reviewCount: 0, soldCount: 0, live: false, daysAgo: 0 },
]

const now = new Date('2026-10-01T09:00:00Z').getTime()

export const products: Product[] = seeds.map((s) => {
  const created = new Date(now - s.daysAgo * 86_400_000).toISOString()
  return {
    id: `p-${String(s.n).padStart(4, '0')}`,
    title: s.title,
    brand: s.brand,
    shortDesc: s.shortDesc,
    longDesc: `${s.shortDesc} The ${s.title} by ${s.brand} is built for people who care about quality and everyday reliability. Every unit is quality-checked before dispatch and backed by a 1-year manufacturer warranty.\n\nWhat's in the box: the product, user manual and warranty card. Easy 7-day returns if it isn't the right fit.`,
    price: s.price,
    discount: s.discount,
    live: s.live ?? true,
    productImages: s.images.map(img),
    categories: [cat(s.category)],
    reviews: s.reviewCount > 0 ? sampleReviews : [],
    rating: s.rating,
    reviewCount: s.reviewCount,
    soldCount: s.soldCount,
    featured: s.featured ?? false,
    createdAt: created,
    updatedAt: created,
  }
})
