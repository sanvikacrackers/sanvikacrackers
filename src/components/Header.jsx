import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Menu, X, Download, Search } from 'lucide-react'

import { useShop } from '../context/ShopContext'
import '../App.css'
import LOGO from '../assets/websitelogo.jpeg'

const NAV = [
  { label: 'Home',        to: '/' },
  { label: 'About',       to: '/about' },
  { label: 'Products',    to: '/products' },
  { label: 'Safety Tips', to: '/safety' },
  { label: 'Contact',     to: '/contact' },
]

const TRACKING_URL = 'https://www.metturtransports.com/tracking/'

export default function Header() {
  const { cartCount, wishlistCount, siteSettings } = useShop()
  const pricelistUrl = siteSettings?.pricelist_url
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  function handleSearch(e) {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchVal.trim())}`)
      setSearchOpen(false)
      setSearchVal('')
    }
  }

  function isActive(to) {
    if (to === '/') return pathname === '/'
    return pathname.startsWith(to)
  }

  return (
    <>
      <header className="sticky top-0 z-50" style={{
        background: '#4d0004',
        boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
        paddingTop: 8, paddingBottom: 8
      }}>
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between h-20 gap-4">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 no-underline">
              <img src={LOGO} alt="Sanvika Crackers" style={{ height: 90, width: 90, borderRadius: '50%', objectFit: 'contain', background: '#fff' }} />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className="nav-link"
                  style={isActive(to) ? { color: '#F59E0B', fontWeight: 700 } : { color: '#e2e8f0' }}
                >
                  {label}
                </Link>
              ))}
              <a
                href={TRACKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link"
                style={{ color: '#e2e8f0' }}
              >
                Tracking
              </a>
              <Link
                to="/wishlist"
                className="nav-link"
                style={isActive('/wishlist') ? { color: '#F59E0B', fontWeight: 700 } : { color: '#e2e8f0' }}
              >
                <span className="flex items-center gap-1">
                  <Heart size={14} />
                  Wishlist
                  {wishlistCount > 0 && <span style={{ background: '#BE185D', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{wishlistCount}</span>}
                </span>
              </Link>
              <Link
                to="/cart"
                className="nav-link"
                style={isActive('/cart') ? { color: '#F59E0B', fontWeight: 700 } : { color: '#e2e8f0' }}
              >
                <span className="flex items-center gap-1">
                  <ShoppingCart size={14} />
                  Cart
                  {cartCount > 0 && <span style={{ background: '#BE185D', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{cartCount}</span>}
                </span>
              </Link>
            </nav>

            {/* Right side — search + price list only */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSearchOpen(o => !o); setSearchVal('') }}
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#e2e8f0', borderRadius: 8, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                aria-label="Search"
              >
                {searchOpen ? <X size={18} /> : <Search size={18} />}
              </button>
              {pricelistUrl && (
                <a
                  href={pricelistUrl}
                  download="Sanvika-Crackers-Pricelist.pdf"
                  className="flex pricelist-btn"
                  title="Download Price List"
                >
                  <Download size={16} />
                  <span className="hidden lg:inline">Price List</span>
                </a>
              )}

              {/* Hamburger — mobile only */}
              <button
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-md" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#e2e8f0' }}
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Search Dropdown */}
      {searchOpen && (
        <div style={{ background: '#4d0004', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', position: 'sticky', top: 88, zIndex: 49, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          <form onSubmit={handleSearch} style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                ref={searchRef}
                type="text"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search crackers, sparklers, rockets..."
                style={{
                  width: '100%', boxSizing: 'border-box', height: 44,
                  borderRadius: 10, paddingLeft: 38, paddingRight: 14,
                  fontSize: '0.95rem', border: '2px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.1)', color: '#fff',
                  outline: 'none', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#4C1D95'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
              />
            </div>
            <button type="submit" style={{
              background: '#4C1D95', color: '#fff', border: 'none',
              borderRadius: 10, padding: '0 20px', fontSize: '0.9rem',
              fontWeight: 700, cursor: 'pointer',
            }}>
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: 260,
        background: '#fff', zIndex: 9999,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
      }}>
        {/* Sidebar Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
          <img src={LOGO} alt="Sanvika Crackers" style={{ height: 36, objectFit: 'contain' }} />
          <button
            onClick={() => setOpen(false)}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={18} color="#333" />
          </button>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              style={{
                display: 'block', padding: '13px 20px',
                fontSize: 15, fontWeight: isActive(to) ? 700 : 500,
                color: isActive(to) ? '#4C1D95' : '#222',
                textDecoration: 'none',
                borderLeft: isActive(to) ? '3px solid #4C1D95' : '3px solid transparent',
                background: isActive(to) ? '#F3E8FF' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              {label}
            </Link>
          ))}

          {/* Tracking link */}
          <a
            href={TRACKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{
              display: 'block', padding: '13px 20px',
              fontSize: 15, fontWeight: 500,
              color: '#222',
              textDecoration: 'none',
              borderLeft: '3px solid transparent',
              background: 'transparent',
              transition: 'background 0.15s',
            }}
          >
            Tracking
          </a>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '13px 20px',
              fontSize: 15, fontWeight: isActive('/wishlist') ? 700 : 500,
              color: isActive('/wishlist') ? '#4C1D95' : '#222',
              textDecoration: 'none',
              borderLeft: isActive('/wishlist') ? '3px solid #4C1D95' : '3px solid transparent',
              background: isActive('/wishlist') ? '#F3E8FF' : 'transparent',
            }}
          >
            <Heart size={15} /> Wishlist
            {wishlistCount > 0 && <span style={{ background: '#BE185D', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{wishlistCount}</span>}
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '13px 20px',
              fontSize: 15, fontWeight: isActive('/cart') ? 700 : 500,
              color: isActive('/cart') ? '#4C1D95' : '#222',
              textDecoration: 'none',
              borderLeft: isActive('/cart') ? '3px solid #4C1D95' : '3px solid transparent',
              background: isActive('/cart') ? '#F3E8FF' : 'transparent',
            }}
          >
            <ShoppingCart size={15} /> Cart
            {cartCount > 0 && <span style={{ background: '#BE185D', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{cartCount}</span>}
          </Link>

          {/* Download Price List — below Contact */}
          {pricelistUrl && (
            <div style={{ padding: '10px 16px 4px' }}>
              <a
                href={pricelistUrl}
                download="Sanvika-Crackers-Pricelist.pdf"
                onClick={() => setOpen(false)}
                className="pricelist-btn"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '12px 16px', borderRadius: 10,
                  fontSize: 14, fontWeight: 700, textDecoration: 'none',
                  width: '100%', boxSizing: 'border-box',
                }}
              >
                <Download size={17} /> Download Price List
              </a>
            </div>
          )}
        </nav>

      </div>
    </>
  )
}
