import type { Category } from '@/types'

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=70`

export const categories: Category[] = [
  {
    id: 1,
    title: 'Electronics',
    slug: 'electronics',
    image: img('photo-1498049794561-7780e7231661'),
    description: 'Phones, laptops, audio and smart devices',
  },
  {
    id: 2,
    title: 'Fashion',
    slug: 'fashion',
    image: img('photo-1445205170230-053b83016050'),
    description: 'Clothing, footwear and accessories',
  },
  {
    id: 3,
    title: 'Home & Living',
    slug: 'home-living',
    image: img('photo-1586023492125-27b2c045efd7'),
    description: 'Furniture, decor and kitchen essentials',
  },
  {
    id: 4,
    title: 'Beauty',
    slug: 'beauty',
    image: img('photo-1596462502278-27bfdc403348'),
    description: 'Skincare, fragrance and grooming',
  },
  {
    id: 5,
    title: 'Sports & Fitness',
    slug: 'sports-fitness',
    image: img('photo-1517836357463-d25dfeac3438'),
    description: 'Gear for training and the outdoors',
  },
  {
    id: 6,
    title: 'Books',
    slug: 'books',
    image: img('photo-1512820790803-83ca734da794'),
    description: 'Bestsellers, tech and self-help',
  },
]
