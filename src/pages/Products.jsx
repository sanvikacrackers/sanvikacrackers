import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Heart, Search, SlidersHorizontal,
  ChevronUp, ChevronDown, X, SlidersVertical,
} from 'lucide-react'
import { useShop } from '../context/ShopContext'
import Footer from '../components/Footer'
import AddToCartButton from '../components/AddToCartButton'
import TopBar from '../components/TopBar'
import Header from '../components/Header'
import useSEO from '../utils/useSEO'
import '../App.css'



function parseImages(imgUrl) {
  if (!imgUrl) return []
  try { const a = JSON.parse(imgUrl); return Array.isArray(a) ? a : [imgUrl] }
  catch { return [imgUrl] }
}

function fmtPrice(v) {
  return '₹' + parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })
}

// ─── Premium Product Card ──────────────────────────────────────────────────────
function ProductCard({ product }) {
  const { addToCart, cartQtys, setQty, toggleWishlist, isWishlisted } = useShop()
  const navigate   = useNavigate()
  const imgs       = parseImages(product.image_url)
  const qty        = cartQtys[product.id] || 0
  const wishlisted = isWishlisted(product.id)
  const [activeImg, setActiveImg] = useState(0)
  const price    = parseFloat(product.price || 0)
  const mrp      = parseFloat(product.mrp || 0)
  const offerPct = product.discount_percentage > 0
    ? product.discount_percentage
    : (mrp > price && price > 0 ? Math.round((1 - price / mrp) * 100) : 0)
  const hasMrp = mrp > price

  return (
    <div
      onClick={() => navigate(`/products/${product.id}`)}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07)'
      }}
      style={{
        background: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: '1px solid #ece8e1',
        cursor: 'pointer',
        transition: 'transform 0.22s, box-shadow 0.22s',
        boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
      }}
    >
      {/* Image area */}
      <div style={{ position: 'relative', background: '#f5f3f0', flexShrink: 0 }}>
        <div style={{ position: 'relative', height: 170, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={imgs[activeImg] || '/images/noimage.jpg'}
            alt={product.name}
            loading="lazy"
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
          />
          {/* Offer pill — top left */}
          {offerPct > 0 && (
            <div style={{
              position: 'absolute', top: 10, left: 10, zIndex: 3,
              background: '#4d0004', color: '#FDE68A',
              borderRadius: 20, padding: '4px 10px',
              fontSize: 10, fontWeight: 800,
              letterSpacing: '0.4px', textTransform: 'uppercase',
            }}>
              {offerPct}% Off
            </div>
          )}
          {/* Wishlist — top right */}
          <button
            onClick={e => { e.stopPropagation(); toggleWishlist(product.id) }}
            title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            style={{
              position: 'absolute', top: 10, right: 10, zIndex: 10,
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid #e5e5e5',
              borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Heart size={15} fill={wishlisted ? '#ef4444' : 'none'} color={wishlisted ? '#ef4444' : '#aaa'} />
          </button>
        </div>

        {/* Thumbnails */}
        {imgs.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '6px 8px 8px', background: '#f5f3f0' }}>
            {imgs.slice(0, 4).map((src, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setActiveImg(i) }}
                style={{
                  width: 24, height: 24, borderRadius: 5, overflow: 'hidden', padding: 0, flexShrink: 0,
                  border: i === activeImg ? '2px solid #4d0004' : '1px solid #ddd',
                  cursor: 'pointer', opacity: i === activeImg ? 1 : 0.55, transition: '0.15s', background: 'none',
                }}
              >
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 14px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px', lineHeight: 1.35 }}>
          {product.name}
        </h3>
        {product.description && (
          <p style={{ fontSize: 11, color: '#888', margin: '0 0 6px', lineHeight: 1.45 }}>
            {product.description}
          </p>
        )}
        {/* Info chips */}
        {(product.category || product.order_unit) && (
          <div style={{ display: 'flex', borderTop: '1px solid #f0ece6', borderBottom: '1px solid #f0ece6', margin: '0 0 12px' }}>
            {product.category && (
              <div style={{ flex: 1, padding: '7px 8px', borderRight: product.order_unit ? '1px solid #f0ece6' : 'none' }}>
                <p style={{ fontSize: 9, color: '#bbb', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Category</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#4d0004', margin: 0, lineHeight: 1.2 }}>{product.category}</p>
              </div>
            )}
            {product.order_unit && (
              <div style={{ flex: 1, padding: '7px 8px' }}>
                <p style={{ fontSize: 9, color: '#bbb', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Unit</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#4d0004', margin: 0, lineHeight: 1.2 }}>{product.order_unit}</p>
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Quantity row — only when in cart */}
        {qty > 0 && (
          <div
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>Quantity</span>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #d1d5db', borderRadius: 20, overflow: 'hidden' }}>
              <button type="button" onClick={() => setQty(product.id, qty - 1)}
                style={{ width: 30, height: 28, border: 'none', background: 'transparent', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', color: '#4d0004', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ minWidth: 24, textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#1a1a1a' }}>{qty}</span>
              <button type="button" onClick={() => setQty(product.id, qty + 1)}
                style={{ width: 30, height: 28, border: 'none', background: 'transparent', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', color: '#4d0004', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>
        )}
      </div>

      {/* Price + Add to Cart row */}
      <div
        style={{ padding: '0 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <p style={{ fontSize: 17, fontWeight: 900, color: '#4d0004', margin: 0, lineHeight: 1 }}>
            {fmtPrice(product.price)}
          </p>
          {hasMrp && (
            <span style={{ fontSize: 11, color: '#bbb', textDecoration: 'line-through', display: 'block', marginTop: 2 }}>
              {fmtPrice(product.mrp)}
            </span>
          )}
        </div>
        <AddToCartButton
          disabled={!product.is_active}
          label={qty > 0 ? 'More' : 'Cart'}
          onClick={() => addToCart(product.id)}
        />
      </div>
    </div>
  )
}

// ─── Filter Sidebar ────────────────────────────────────────────────────────────
function FilterSidebar({ categories, selectedCats, onToggleCat, search, onSearch, priceRange, onPriceRange, maxPrice, totalCount, hasAnyFilter, onClearAll, onClose }) {
  const [catOpen, setCatOpen]     = useState(true)
  const [priceOpen, setPriceOpen] = useState(true)

  return (
    <div style={onClose ? {} : {
      background: '#fff', borderRadius: 16,
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      border: '1px solid #e2e8f0',
      padding: '20px',
      position: 'sticky', top: 80, zIndex: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid #f1f5f9', marginBottom: 18 }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={18} color="#4C1D95" />
          Filters
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {hasAnyFilter && (
            <button onClick={onClearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#BE185D', fontSize: '0.8rem', fontWeight: 600 }}>
              Clear all
            </button>
          )}
          {onClose && (
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} color="#333" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
          Search Crackers
        </label>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: 12, color: '#94a3b8' }} />
          <input
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search by name or code.."
            style={{
              width: '100%', boxSizing: 'border-box',
              borderRadius: 10, paddingLeft: 34, paddingRight: search ? 32 : 12,
              height: 40, fontSize: '0.88rem',
              border: '1px solid #e2e8f0', outline: 'none', fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = '#4C1D95'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          {search && (
            <button onClick={() => onSearch('')} style={{ position: 'absolute', right: 8, top: 11, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <hr style={{ margin: '0 0 18px', borderColor: '#f1f5f9' }} />

      {/* Price Range */}
      <div style={{ marginBottom: 18 }}>
        <div
          onClick={() => setPriceOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: priceOpen ? 12 : 0 }}
        >
          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>Price Range</span>
          {priceOpen ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
        </div>

        {priceOpen && (
          <div>
            {/* Slider */}
            <input
              type="range"
              min={0}
              max={maxPrice}
              step={10}
              value={priceRange[1]}
              onChange={e => onPriceRange([priceRange[0], Number(e.target.value)])}
              style={{ width: '100%', accentColor: '#4C1D95', marginBottom: 10 }}
            />
            {/* Min / Max inputs */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 3 }}>Min (₹)</div>
                <input
                  type="number"
                  value={priceRange[0]}
                  min={0}
                  max={priceRange[1]}
                  onChange={e => onPriceRange([Math.max(0, Number(e.target.value)), priceRange[1]])}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '6px 8px',
                    border: '1px solid #e2e8f0', borderRadius: 8,
                    fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#4C1D95'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <span style={{ color: '#94a3b8', marginTop: 16 }}>—</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 3 }}>Max (₹)</div>
                <input
                  type="number"
                  value={priceRange[1]}
                  min={priceRange[0]}
                  max={maxPrice}
                  onChange={e => onPriceRange([priceRange[0], Math.min(maxPrice, Number(e.target.value))])}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '6px 8px',
                    border: '1px solid #e2e8f0', borderRadius: 8,
                    fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#4C1D95'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4C1D95', fontWeight: 600, marginTop: 6, textAlign: 'center' }}>
              ₹{priceRange[0].toLocaleString('en-IN')} – ₹{priceRange[1].toLocaleString('en-IN')}
            </div>
          </div>
        )}
      </div>

      <hr style={{ margin: '0 0 18px', borderColor: '#f1f5f9' }} />

      {/* Categories */}
      <div>
        <div
          onClick={() => setCatOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: catOpen ? 10 : 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>Categories</span>
            <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', borderRadius: 999, padding: '1px 8px' }}>
              {categories.length}
            </span>
          </div>
          {catOpen ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
        </div>

        {catOpen && (
          <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
            {/* All */}
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 8px', borderRadius: 8, marginBottom: 2, cursor: 'pointer',
              background: selectedCats.length === 0 ? '#F3E8FF' : 'transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={selectedCats.length === 0}
                  onChange={() => onToggleCat(null)}
                  style={{ width: 15, height: 15, accentColor: '#4C1D95', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: selectedCats.length === 0 ? 700 : 400, color: selectedCats.length === 0 ? '#4C1D95' : '#334155' }}>
                  All Categories
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', borderRadius: 999, padding: '1px 8px' }}>
                {totalCount}
              </span>
            </label>

            {categories.map(({ name, count }) => {
              const checked = selectedCats.includes(name)
              return (
                <label key={name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 8px', borderRadius: 8, marginBottom: 2, cursor: 'pointer',
                  background: checked ? '#F3E8FF' : 'transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleCat(name)}
                      style={{ width: 15, height: 15, accentColor: '#4C1D95', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: checked ? '#4C1D95' : '#cbd5e1',
                      display: 'inline-block',
                    }} />
                    <span style={{
                      fontSize: '0.88rem', fontWeight: checked ? 700 : 400,
                      color: checked ? '#4C1D95' : '#334155',
                    }}>{name}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', borderRadius: 999, padding: '1px 8px', flexShrink: 0 }}>
                    {count}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Products Page ─────────────────────────────────────────────────────────────
export default function Products() {
  useSEO({
    title: 'Fireworks & Crackers Shop – Sanvika Crackers | Sivakasi',
    description: 'Browse our wide range of fireworks – sparklers, sky shots, rockets, ground chakkar, fancy items and more. Order online with competitive Sivakasi factory prices.',
    url: '/products',
  })

  const { products, loading } = useShop()
  const [searchParams] = useSearchParams()
  const [search, setSearch]           = useState(searchParams.get('q') || '')

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearch(q)
  }, [searchParams])
  const [selectedCats, setSelectedCats] = useState([])
  const [priceRange, setPriceRange]   = useState([0, 0])
  const [priceInited, setPriceInited] = useState(false)
  const [mobileFilter, setMobileFilter] = useState(false)

  // Compute max price & init range once products load
  const maxPrice = useMemo(() => {
    if (!products.length) return 10000
    return Math.ceil(Math.max(...products.map(p => parseFloat(p.price || 0))) / 100) * 100
  }, [products])

  if (!priceInited && maxPrice > 0) {
    setPriceRange([0, maxPrice])
    setPriceInited(true)
  }

  // Build category list with counts (based on full product list)
  const categories = useMemo(() => {
    const map = {}
    products.forEach(p => { map[p.category] = (map[p.category] || 0) + 1 })
    return Object.entries(map).map(([name, count]) => ({ name, count }))
  }, [products])

  // Filtered products
  const filtered = useMemo(() => {
    let list = products
    if (selectedCats.length > 0) list = list.filter(p => selectedCats.includes(p.category))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.product_code?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
    }
    list = list.filter(p => {
      const price = parseFloat(p.price || 0)
      return price >= priceRange[0] && price <= priceRange[1]
    })
    return list
  }, [products, selectedCats, search, priceRange])

  function toggleCat(name) {
    if (name === null) { setSelectedCats([]); return }
    setSelectedCats(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

  const hasAnyFilter = selectedCats.length > 0 || search !== '' || priceRange[0] > 0 || priceRange[1] < maxPrice

  function clearAll() {
    setSearch('')
    setSelectedCats([])
    setPriceRange([0, maxPrice])
  }

  const sidebarProps = {
    categories, selectedCats, onToggleCat: toggleCat,
    search, onSearch: setSearch,
    priceRange, onPriceRange: setPriceRange, maxPrice,
    totalCount: products.length, hasAnyFilter, onClearAll: clearAll,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF5' }}>

      <TopBar />

      <Header />

      {/* ── Page title bar ───────────────────────────────────────────── */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e8e8e8', padding: '14px 0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>All Products</h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              {loading ? 'Loading...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 260px', maxWidth: 420 }}>
            {/* Search bar — always visible */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search crackers..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  height: 42, borderRadius: 10,
                  paddingLeft: 36, paddingRight: search ? 36 : 14,
                  fontSize: '0.9rem', border: '1.5px solid #e2e8f0',
                  background: '#fff', outline: 'none', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#4C1D95'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                  <X size={15} />
                </button>
              )}
            </div>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFilter(o => !o)}
              className="lg:hidden"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                background: '#4C1D95', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <SlidersVertical size={16} /> Filters
              {hasAnyFilter && (
                <span style={{ background: '#fff', color: '#4C1D95', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  !
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ─────────────────────────────────────── */}
      {mobileFilter && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setMobileFilter(false)}
        >
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: '#ffffff', borderRadius: '20px 20px 0 0',
              maxHeight: '88vh', overflowY: 'auto',
              animation: 'slideUp 0.28s ease',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#d1d5db' }} />
            </div>
            <div style={{ padding: '0 16px 24px' }}>
              <FilterSidebar {...sidebarProps} onClose={() => setMobileFilter(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* Sidebar — desktop only */}
          <div style={{ width: 268, flexShrink: 0 }} className="hidden lg:block">
            <FilterSidebar {...sidebarProps} />
          </div>

          {/* Product Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div className="products-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #ece8e1', display: 'flex', flexDirection: 'column' }}>
                    <div className="skeleton" style={{ height: 170, background: 'linear-gradient(90deg,#f0ede8 25%,#f8f6f3 50%,#f0ede8 75%)', backgroundSize: '1200px 100%' }} />
                    <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="skeleton" style={{ height: 13, borderRadius: 4 }} />
                      <div className="skeleton" style={{ height: 18, width: '50%', borderRadius: 4 }} />
                      <div style={{ flex: 1, minHeight: 8 }} />
                      <div className="skeleton" style={{ height: 36, borderRadius: 10, marginTop: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
                <h3 style={{ color: '#334155', margin: '0 0 8px' }}>No products found</h3>
                <p style={{ margin: '0 0 16px' }}>Try adjusting your search or filters</p>
                <button
                  onClick={clearAll}
                  style={{ background: '#4C1D95', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {filtered.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
