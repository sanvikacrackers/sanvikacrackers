import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ShopProvider, useShop } from './context/ShopContext'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,               // always stale → every mount triggers a background refetch, cached data shows instantly (no loader)
      gcTime: 5 * 60 * 1000,      // keep unused cache for 5 min so navigation feels instant
      retry: 1,
      refetchOnWindowFocus: true, // silently refetch when tab regains focus
    },
  },
})
import pricelistImg from './assets/pricelist.png'

// ── Public pages (eager — user always lands here) ─────
import Home        from './pages/Home'
import Cart        from './pages/Cart'
import Wishlist    from './pages/Wishlist'
import About       from './pages/About'
import Safety      from './pages/Safety'
import Products    from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Contact     from './pages/Contact'

// ── Admin pages (lazy — only loaded when admin navigates there) ───
const AdminLogin    = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminLogin })))
const AdminLayout   = lazy(() => import('./pages/Admin').then(m => ({ default: m.default })))
const AdminDashboard     = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminDashboard })))
const AdminOrders        = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminOrders })))
const AdminCategories    = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminCategories })))
const AdminProducts      = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminProducts })))
const AdminHeroBanners   = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminHeroBanners })))
const AdminAnnouncement  = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminAnnouncement })))
const AdminSettings      = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminSettings })))
const AdminStaff         = lazy(() => import('./pages/admin/AdminStaff'))
const AdminBillingOrders = lazy(() => import('./pages/admin/AdminBillingOrders'))
const AdminBillEdit      = lazy(() => import('./pages/admin/AdminBillEdit'))
const AdminBarcodes      = lazy(() => import('./pages/admin/AdminBarcodes'))
const AdminReports           = lazy(() => import('./pages/admin/AdminReports'))
const AdminBillingDashboard  = lazy(() => import('./pages/admin/AdminBillingDashboard'))

// ── Staff pages (lazy) ────────────────────────────────
const StaffLogin      = lazy(() => import('./pages/StaffLogin'))
const StaffLayout     = lazy(() => import('./pages/staff/StaffLayout'))
const StaffDashboard  = lazy(() => import('./pages/staff/StaffDashboard'))
const StaffNewBill    = lazy(() => import('./pages/staff/StaffNewBill'))
const StaffOrders     = lazy(() => import('./pages/staff/StaffOrders'))
const StaffOrderDetail = lazy(() => import('./pages/staff/StaffOrderDetail'))
const StaffProducts   = lazy(() => import('./pages/staff/StaffProducts'))
const StaffProfile    = lazy(() => import('./pages/staff/StaffProfile'))
const StaffBillingDashboard = lazy(() => import('./pages/staff/StaffBillingDashboard'))

// Minimal page-level loader shown only on first chunk download (subsequent navigations use cache)
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

async function downloadPricelist(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = 'Sanvika-Crackers-Pricelist.pdf'
    a.click()
    URL.revokeObjectURL(blobUrl)
  } catch {
    window.open(url, '_blank')
  }
}

function PricelistFAB() {
  const { pathname } = useLocation()
  const { siteSettings } = useShop()
  const pricelistUrl = siteSettings?.pricelist_url
  if (pathname.startsWith('/admin') || pathname.startsWith('/staff')) return null
  if (!pricelistUrl) return null
  return (
    <img
      src={pricelistImg}
      alt="Download Price List"
      title="Download Price List"
      onClick={() => downloadPricelist(pricelistUrl)}
      style={{
        position: 'fixed', bottom: 20, left: 16, zIndex: 9990,
        width: 110, height: 'auto',
        cursor: 'pointer',
        filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))',
        transition: 'transform 0.2s, filter 0.2s',
        animation: 'fab-float 3s ease-in-out infinite, fab-blink 2s ease-in-out infinite',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.filter = 'drop-shadow(0 6px 16px rgba(0,0,0,0.35))' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))' }}
    />
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <ScrollToTop />
          <PricelistFAB />
          <Toaster position="top-center" containerStyle={{ zIndex: 1000000 }} />
          <Routes>
            {/* ── Public storefront (eager — no Suspense needed) ── */}
            <Route path="/"             element={<Home />} />
            <Route path="/cart"         element={<Cart />} />
            <Route path="/wishlist"     element={<Wishlist />} />
            <Route path="/about"        element={<About />} />
            <Route path="/safety"       element={<Safety />} />
            <Route path="/products"     element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/contact"      element={<Contact />} />

            {/* ── Admin (lazy — one chunk download on first visit, cached after) ── */}
            <Route path="/admin/login"  element={<Suspense fallback={<PageLoader />}><AdminLogin /></Suspense>} />
            <Route path="/admin"        element={<Suspense fallback={<PageLoader />}><AdminLayout /></Suspense>}>
              <Route index                   element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard"        element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
              <Route path="orders"           element={<Suspense fallback={<PageLoader />}><AdminOrders /></Suspense>} />
              <Route path="categories"       element={<Suspense fallback={<PageLoader />}><AdminCategories /></Suspense>} />
              <Route path="products"         element={<Suspense fallback={<PageLoader />}><AdminProducts /></Suspense>} />
              <Route path="banners"          element={<Suspense fallback={<PageLoader />}><AdminHeroBanners /></Suspense>} />
              <Route path="announcement"     element={<Suspense fallback={<PageLoader />}><AdminAnnouncement /></Suspense>} />
              <Route path="settings"         element={<Suspense fallback={<PageLoader />}><AdminSettings /></Suspense>} />
              <Route path="staff"            element={<Suspense fallback={<PageLoader />}><AdminStaff /></Suspense>} />
              <Route path="billing-dashboard"       element={<Suspense fallback={<PageLoader />}><AdminBillingDashboard /></Suspense>} />
              <Route path="billing-orders"         element={<Suspense fallback={<PageLoader />}><AdminBillingOrders /></Suspense>} />
              <Route path="billing-orders/:id/edit" element={<Suspense fallback={<PageLoader />}><AdminBillEdit /></Suspense>} />
              <Route path="barcodes"         element={<Suspense fallback={<PageLoader />}><AdminBarcodes /></Suspense>} />
              <Route path="reports"          element={<Suspense fallback={<PageLoader />}><AdminReports /></Suspense>} />
            </Route>

            {/* ── Staff portal (lazy — separate chunk from admin) ── */}
            <Route path="/staff/login"  element={<Suspense fallback={<PageLoader />}><StaffLogin /></Suspense>} />
            <Route path="/staff"        element={<Suspense fallback={<PageLoader />}><StaffLayout /></Suspense>}>
              <Route index                   element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="dashboard"        element={<Suspense fallback={<PageLoader />}><StaffDashboard /></Suspense>} />
              <Route path="new-bill"         element={<Suspense fallback={<PageLoader />}><StaffNewBill /></Suspense>} />
              <Route path="products"         element={<Suspense fallback={<PageLoader />}><StaffProducts /></Suspense>} />
              <Route path="orders"           element={<Suspense fallback={<PageLoader />}><StaffOrders /></Suspense>} />
              <Route path="orders/:id"       element={<Suspense fallback={<PageLoader />}><StaffOrderDetail /></Suspense>} />
              <Route path="profile"          element={<Suspense fallback={<PageLoader />}><StaffProfile /></Suspense>} />
              <Route path="billing-dashboard" element={<Suspense fallback={<PageLoader />}><StaffBillingDashboard /></Suspense>} />
            </Route>
          </Routes>
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
    </QueryClientProvider>
  )
}
