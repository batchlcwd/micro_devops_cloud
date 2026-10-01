/** Static reference data that has no backend source. */

export const indianStates = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=70`

/**
 * CategoryDto only has `id` and `title`, so the home page picks a cover image
 * by keyword. Unknown categories fall back to a generic shopping photo.
 */
const categoryCovers: [RegExp, string][] = [
  [/electr|phone|mobile|laptop|gadget|tech/i, img('photo-1498049794561-7780e7231661')],
  [/cloth|fashion|apparel|wear|shoe|foot/i, img('photo-1445205170230-053b83016050')],
  [/home|living|furni|kitchen|decor/i, img('photo-1586023492125-27b2c045efd7')],
  [/beauty|cosmetic|skin|groom|perfume/i, img('photo-1596462502278-27bfdc403348')],
  [/sport|fitness|gym|outdoor/i, img('photo-1517836357463-d25dfeac3438')],
  [/book|station/i, img('photo-1512820790803-83ca734da794')],
]

export const categoryCover = (title: string) =>
  categoryCovers.find(([re]) => re.test(title))?.[1] ?? img('photo-1607082348824-0a96f2a4b9da')

export const heroImage = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=75'
