import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { MainLayout } from '@/layouts/MainLayout'
import { ProtectedRoute, SellerRoute, AdminRoute } from '@/components/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { ProductsPage } from '@/pages/ProductsPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { LoginPage, RegisterPage } from '@/pages/AuthPages'
import { OrdersPage, OrderDetailPage } from '@/pages/OrdersPage'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { ProfilePage } from '@/pages/ProfilePage'
import {
  SellerDashboard,
  SellerOrdersPage,
  SellerProductFormPage,
  SellerProductsPage,
} from '@/pages/SellerPages'
import { AdminDashboard, AdminProductsPage, AdminUsersPage } from '@/pages/AdminPages'
import { NotFoundPage } from '@/pages/NotFoundPage'

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:slug" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route element={<SellerRoute />}>
              <Route path="seller" element={<SellerDashboard />} />
              <Route path="seller/products" element={<SellerProductsPage />} />
              <Route path="seller/products/create" element={<SellerProductFormPage />} />
              <Route path="seller/products/:id/edit" element={<SellerProductFormPage />} />
              <Route path="seller/orders" element={<SellerOrdersPage />} />
            </Route>
            <Route element={<AdminRoute />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="admin/products" element={<AdminProductsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  )
}
