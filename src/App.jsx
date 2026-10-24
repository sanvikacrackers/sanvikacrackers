import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ShopProvider } from './context/ShopContext'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import Fireworks from './components/Fireworks'
import pricelistImg from './assets/pricelist.png'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function FireworksOverlay() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/admin') || pathname.startsWith('/staff')) return null
  return <Fireworks />
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

// ── Public pages ──────────────────────────────────────
import Home from './pages/Home'
import Cart from './pages/Cart'
import Wishlist from './pages/Wishlist'
import About from './pages/About'
import Safety from './pages/Safety'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Contact from './pages/Contact'

// ── Admin pages ───────────────────────────────────────
import AdminLayout, {
  AdminLogin,
  AdminCategories,
  AdminProducts,
  AdminAnnouncement,
  AdminHeroBanners,
  AdminSettings,
  AdminOrders,
  AdminDashboard,
} from './pages/Admin'
import AdminStaff from './pages/admin/AdminStaff'
import AdminBillingOrders from './pages/admin/AdminBillingOrders'
import AdminBarcodes from './pages/admin/AdminBarcodes'
import AdminReports from './pages/admin/AdminReports'

// ── Staff pages ───────────────────────────────────────
import StaffLogin from './pages/StaffLogin'
import StaffLayout from './pages/staff/StaffLayout'
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffNewBill from './pages/staff/StaffNewBill'
import StaffOrders from './pages/staff/StaffOrders'
import StaffOrderDetail from './pages/staff/StaffOrderDetail'
import StaffProducts from './pages/staff/StaffProducts'
import StaffProfile from './pages/staff/StaffProfile'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <ScrollToTop />
          <FireworksOverlay />
          <PricelistFAB />
          <Toaster position="top-center" containerStyle={{ zIndex: 1000000 }} />
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
              {/* ── New admin sections ── */}
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
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
