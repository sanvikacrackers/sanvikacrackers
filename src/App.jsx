import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { ShopProvider } from './context/ShopContext'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
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
const AdminBarcodes      = lazy(() => import('./pages/admin/AdminBarcodes'))
const AdminReports       = lazy(() => import('./pages/admin/AdminReports'))

// ── Staff pages (lazy) ────────────────────────────────
const StaffLogin      = lazy(() => import('./pages/StaffLogin'))
const StaffLayout     = lazy(() => import('./pages/staff/StaffLayout'))
const StaffDashboard  = lazy(() => import('./pages/staff/StaffDashboard'))
const StaffNewBill    = lazy(() => import('./pages/staff/StaffNewBill'))
const StaffOrders     = lazy(() => import('./pages/staff/StaffOrders'))
const StaffOrderDetail = lazy(() => import('./pages/staff/StaffOrderDetail'))
const StaffProducts   = lazy(() => import('./pages/staff/StaffProducts'))
const StaffProfile    = lazy(() => import('./pages/staff/StaffProfile'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function PricelistFAB() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  if (pathname.startsWith('/admin') || pathname.startsWith('/staff') || pathname === '/products' || pathname.startsWith('/products/')) return null
  return (
    <img
      src={pricelistImg}
      alt="View Products"
      title="View Products"
      onClick={() => navigate('/products')}
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
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <ScrollToTop />
          <PricelistFAB />
          <Toaster position="top-center" containerStyle={{ zIndex: 1000000 }} />
          <Suspense fallback={null}>
            <Routes>
              {/* ── Public storefront ── */}
              <Route path="/"             element={<Home />} />
              <Route path="/cart"         element={<Cart />} />
              <Route path="/wishlist"     element={<Wishlist />} />
              <Route path="/about"        element={<About />} />
              <Route path="/safety"       element={<Safety />} />
              <Route path="/products"     element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/contact"      element={<Contact />} />

              {/* ── Admin ── */}
              <Route path="/admin/login"  element={<AdminLogin />} />
              <Route path="/admin"        element={<AdminLayout />}>
                <Route index                   element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard"        element={<AdminDashboard />} />
                <Route path="orders"           element={<AdminOrders />} />
                <Route path="categories"       element={<AdminCategories />} />
                <Route path="products"         element={<AdminProducts />} />
                <Route path="banners"          element={<AdminHeroBanners />} />
                <Route path="announcement"     element={<AdminAnnouncement />} />
                <Route path="settings"         element={<AdminSettings />} />
                <Route path="staff"            element={<AdminStaff />} />
                <Route path="billing-orders"   element={<AdminBillingOrders />} />
                <Route path="barcodes"         element={<AdminBarcodes />} />
                <Route path="reports"          element={<AdminReports />} />
              </Route>

              {/* ── Staff portal ── */}
              <Route path="/staff/login"  element={<StaffLogin />} />
              <Route path="/staff"        element={<StaffLayout />}>
                <Route index                   element={<Navigate to="/staff/dashboard" replace />} />
                <Route path="dashboard"        element={<StaffDashboard />} />
                <Route path="new-bill"         element={<StaffNewBill />} />
                <Route path="products"         element={<StaffProducts />} />
                <Route path="orders"           element={<StaffOrders />} />
                <Route path="orders/:id"       element={<StaffOrderDetail />} />
                <Route path="profile"          element={<StaffProfile />} />
              </Route>
            </Routes>
          </Suspense>
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
