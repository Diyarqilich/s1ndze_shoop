import api from './api'
import type { Cart, Category, Notification, Order, Paginated, Product, Review, User } from '@/types'

export const productsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get<Paginated<Product>>('/products/', { params }).then((r) => r.data),
  home: () =>
    api
      .get<{
        new_arrivals: Product[]
        trending: Product[]
        featured: Product[]
        sale: Product[]
      }>('/products/home/')
      .then((r) => r.data),
  detail: (slug: string) => api.get<Product>(`/products/${slug}/`).then((r) => r.data),
  related: (slug: string) => api.get<Product[]>(`/products/${slug}/related/`).then((r) => r.data),
}

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories/').then((r) => r.data),
}

export const cartApi = {
  get: () => api.get<Cart>('/cart/').then((r) => r.data),
  add: (variant_id: number, quantity = 1) =>
    api.post<Cart>('/cart/items/', { variant_id, quantity }).then((r) => r.data),
  update: (id: number, quantity: number) =>
    api.patch<Cart>(`/cart/items/${id}/`, { quantity }).then((r) => r.data),
  remove: (id: number) => api.delete<Cart>(`/cart/items/${id}/`).then((r) => r.data),
  clear: () => api.delete<Cart>('/cart/clear/').then((r) => r.data),
}

export const favoritesApi = {
  list: () => api.get<Paginated<{ id: number; product: Product }> | { id: number; product: Product }[]>('/favorites/').then((r) => r.data),
  add: (product_id: number) => api.post('/favorites/', { product_id }).then((r) => r.data),
  remove: (id: number) => api.delete(`/favorites/${id}/`),
}

export const ordersApi = {
  list: () => api.get<Paginated<Order> | Order[]>('/orders/').then((r) => r.data),
  detail: (n: string) => api.get<Order>(`/orders/${n}/`).then((r) => r.data),
  checkout: (payload: Record<string, string>) =>
    api.post<Order>('/orders/checkout/', payload).then((r) => r.data),
  cancel: (n: string) => api.post<Order>(`/orders/${n}/cancel/`).then((r) => r.data),
}

export const couponsApi = {
  validate: (code: string, subtotal: number) =>
    api.post('/coupons/validate/', { code, subtotal }).then((r) => r.data),
}

export const notificationsApi = {
  list: () => api.get<Paginated<Notification> | Notification[]>('/notifications/').then((r) => r.data),
  unread: () => api.get<{ unread: number }>('/notifications/unread-count/').then((r) => r.data),
  markAll: () => api.post('/notifications/mark-read/'),
}

export const reviewsApi = {
  list: (slug: string) =>
    api.get<Paginated<Review> | Review[]>(`/reviews/product/${slug}/`).then((r) => r.data),
  create: (payload: Record<string, string | number>) =>
    api.post('/reviews/', payload).then((r) => r.data),
}

export const sellerApi = {
  stats: () => api.get('/seller/stats/').then((r) => r.data),
  products: () => api.get('/seller/products/').then((r) => r.data),
  detail: (id: number) => api.get<Product>(`/seller/products/${id}/`).then((r) => r.data),
  create: (payload: FormData | Record<string, unknown>) =>
    api.post('/seller/products/', payload).then((r) => r.data),
  update: (id: number, payload: Record<string, unknown>) =>
    api.patch(`/seller/products/${id}/`, payload).then((r) => r.data),
  remove: (id: number) => api.delete(`/seller/products/${id}/`),
  orders: () => api.get('/seller/orders/').then((r) => r.data),
  uploadImage: (id: number, file: File) => {
    const fd = new FormData()
    fd.append('image', file)
    fd.append('is_main', 'true')
    return api.post(`/seller/products/${id}/images/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export interface AdminStats {
  total_users: number
  total_buyers: number
  total_sellers: number
  total_admins: number
  total_products: number
  available_products: number
  total_orders: number
  pending_orders: number
  total_revenue: string
}

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats/').then((r) => r.data),
  users: () => api.get<User[]>('/admin/users/').then((r) => r.data),
  removeUser: (id: number) => api.delete(`/admin/users/${id}/`),
  // Admins are permitted to read/delete every product through the seller
  // endpoint (the backend returns the full catalog, not just their own,
  // once it sees an admin role) — reuse it instead of duplicating routes.
  products: () => api.get('/seller/products/').then((r) => r.data),
  removeProduct: (id: number) => api.delete(`/seller/products/${id}/`),
}

export const profileApi = {
  update: (payload: FormData | Partial<User>) =>
    api.patch('/auth/profile/', payload).then((r) => r.data),
}

export function unwrapList<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results
}
