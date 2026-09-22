export type Role = 'buyer' | 'seller' | 'admin'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  avatar: string | null
  bio: string
  role: Role
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  image: string | null
  description: string
  parent: number | null
  children?: Category[]
}

export interface ProductVariant {
  id: number
  size: string
  color: string
  stock: number
  price: string | null
  effective_price: string
}

export interface ProductImage {
  id: number
  image: string
  is_main: boolean
  ordering: number
}

export interface Product {
  id: number
  name: string
  slug: string
  brand: string
  price: string
  old_price: string | null
  gender: string
  is_available: boolean
  is_featured: boolean
  is_new: boolean
  is_sale: boolean
  views_count: number
  main_image: string | null
  average_rating: number
  reviews_count: number
  discount_percent: number
  category: number
  category_name: string
  total_stock: number
  is_favorited: boolean
  created_at: string
  description?: string
  material?: string
  images?: ProductImage[]
  variants?: ProductVariant[]
  seller?: number
  seller_username?: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface CartItem {
  id: number
  product: Product
  variant: number
  variant_size: string
  variant_color: string
  quantity: number
  price: string
  subtotal: string
}

export interface Cart {
  id: number
  items: CartItem[]
  subtotal: string
  items_count: number
  updated_at: string
}

export interface OrderItem {
  id: number
  product: number | null
  product_name: string
  size: string
  color: string
  price: string
  quantity: number
  subtotal: string
}

export interface Order {
  id: number
  order_number: string
  total_price: string
  subtotal: string
  discount: string
  delivery_price: string
  payment_method: string
  status: string
  first_name: string
  last_name: string
  phone: string
  city: string
  address: string
  comment: string
  items: OrderItem[]
  created_at: string
}

export interface Notification {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  link: string
  created_at: string
}

export interface Review {
  id: number
  rating: number
  text: string
  username: string
  created_at: string
}
