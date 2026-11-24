import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { ErrorBoundary } from './components/common/ErrorBoundary'

// Pages
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { OrdersListPage } from './pages/orders/OrdersListPage'
import { CreateOrderPage } from './pages/orders/CreateOrderPage'
import { OrderDetailPage } from './pages/orders/OrderDetailPage'
import { AudioDeptPage } from './pages/audio/AudioDeptPage'
import { VideoDeptPage } from './pages/video/VideoDeptPage'
import { QualityControlPage } from './pages/quality-control/QualityControlPage'
import { DeliveryPage } from './pages/delivery/DeliveryPage'
import { AccountingPage } from './pages/accounting/AccountingPage'
import { ReportsPage } from './pages/reports/ReportsPage'
import { StaffPage } from './pages/staff/StaffPage'
import { SettingsPage } from './pages/settings/SettingsPage'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                {/* Public Login Route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Application Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="orders" element={<OrdersListPage />} />
                    <Route path="orders/new" element={<CreateOrderPage />} />
                    <Route path="orders/:id" element={<OrderDetailPage />} />
                    <Route path="audio" element={<AudioDeptPage />} />
                    <Route path="video" element={<VideoDeptPage />} />
                    <Route path="quality-control" element={<QualityControlPage />} />
                    <Route path="delivery" element={<DeliveryPage />} />
                    <Route path="accounting" element={<AccountingPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="staff" element={<StaffPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
