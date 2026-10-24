import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Heart, Search, SlidersHorizontal,
  ChevronUp, ChevronDown, X, SlidersVertical,
} from 'lucide-react'
import { useShop } from '../context/ShopContext'
import Footer from '../components/Footer'
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
    <div style={{
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid #f1f1f1',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    }}
      onClick={() => navigate(`/products/${product.id}`)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.13)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      {/* Image area */}
      <div style={{ position: 'relative', padding: '8px 8px 0', background: '#fff' }}>
        <div style={{ background: '#f5f5f7', borderRadius: 12, padding: '12px', textAlign: 'center', position: 'relative' }}>
          {/* Wishlist btn */}
          <button
            onClick={e => { e.stopPropagation(); toggleWishlist(product.id) }}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 34, height: 34, borderRadius: '50%',
              background: '#fff', border: 'none',
              boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 2, transition: '0.2s',
            }}
            title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={16} fill={wishlisted ? '#ef4444' : 'none'} color={wishlisted ? '#ef4444' : '#64748b'} />
          </button>

          {/* Discount badge */}
          {offerPct > 0 && (
            <div className="label-block">
              <span className="label-theme">{offerPct}% Off</span>
            </div>
          )}

          {/* Main image */}
          <div
            style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          >
            <img
              src={imgs[activeImg] || '/images/noimage.jpg'}
              alt={product.name}
              loading="lazy"
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Thumbnails */}
          {imgs.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
              {imgs.slice(0, 4).map((src, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setActiveImg(i) }}
                  style={{
                    width: 26, height: 26, borderRadius: 6, overflow: 'hidden', padding: 0,
                    border: i === activeImg ? '2px solid #ff7011' : '1px solid #d1d5db',
                    cursor: 'pointer', opacity: i === activeImg ? 1 : 0.6, transition: '0.15s',
                  }}
                >
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {/* Category */}
        <span style={{
          fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
        }}>
          {product.category}
        </span>

        <h3
          style={{
            fontSize: '0.92rem', fontWeight: 700, color: '#1a1a1a',
            margin: '0 0 4px', lineHeight: 1.3,
          }}
        >
          {product.name}
        </h3>

        {/* Order unit */}
        {product.order_unit && (
          <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '0 0 8px' }}>
            {product.order_unit}
          </p>
        )}

        <div style={{ flex: 1 }} />

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a1a1a' }}>
            {fmtPrice(product.price)}
          </span>
          {hasMrp && (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>
              {fmtPrice(product.mrp)}
            </span>
          )}
        </div>

        {/* Add to Cart → Qty pill */}
        {!product.is_active ? (
          <button disabled style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: '#e2e8f0', color: '#94a3b8', border: 'none', borderRadius: 999, padding: '9px 0', fontSize: '0.88rem', fontWeight: 700, cursor: 'not-allowed' }}>
            Out of Stock
          </button>
        ) : qty === 0 ? (
          <button
            className="btn-add-cart"
            onClick={e => { e.stopPropagation(); addToCart(product.id) }}
          >
            Add to Cart
          </button>
        ) : (
          <div onClick={e => e.stopPropagation()} style={{
            display: 'flex', alignItems: 'center',
            border: '2px solid #ff7011', borderRadius: 999,
            height: 40, background: '#fff',
            width: '100%', boxSizing: 'border-box', overflow: 'hidden',
          }}>
            <button
              type="button"
              onClick={() => qty <= 1 ? setQty(product.id, 0) : setQty(product.id, qty - 1)}
              style={{
                flexShrink: 0, width: 36, height: '100%',
                border: 'none', background: 'transparent',
                fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer', color: '#ff7011',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >−</button>
            <input
              type="number"
              value={qty}
              min={1}
              onChange={e => {
                const v = parseInt(e.target.value)
                if (!isNaN(v) && v > 0) setQty(product.id, v)
              }}
              style={{
                flex: 1, minWidth: 0, textAlign: 'center', fontWeight: 800,
                fontSize: '0.95rem', color: '#ff7011',
                border: 'none', background: 'transparent', outline: 'none', padding: 0, margin: 0,
                MozAppearance: 'textfield', WebkitAppearance: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setQty(product.id, qty + 1)}
              style={{
                flexShrink: 0, width: 36, height: '100%',
                border: 'none', background: 'transparent',
                fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer', color: '#ff7011',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >+</button>
          </div>
        )}
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
          <SlidersHorizontal size={18} color="#ff7011" />
          Filters
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {hasAnyFilter && (
            <button onClick={onClearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff7011', fontSize: '0.8rem', fontWeight: 600 }}>
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
            onFocus={e => e.target.style.borderColor = '#ff7011'}
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
              style={{ width: '100%', accentColor: '#ff7011', marginBottom: 10 }}
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
                  onFocus={e => e.target.style.borderColor = '#ff7011'}
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
                  onFocus={e => e.target.style.borderColor = '#ff7011'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#ff7011', fontWeight: 600, marginTop: 6, textAlign: 'center' }}>
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
              background: selectedCats.length === 0 ? '#fff3ee' : 'transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={selectedCats.length === 0}
                  onChange={() => onToggleCat(null)}
                  style={{ width: 15, height: 15, accentColor: '#ff7011', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: selectedCats.length === 0 ? 700 : 400, color: selectedCats.length === 0 ? '#ff7011' : '#334155' }}>
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
                  background: checked ? '#fff3ee' : 'transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleCat(name)}
                      style={{ width: 15, height: 15, accentColor: '#ff7011', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: checked ? '#ff7011' : '#cbd5e1',
                      display: 'inline-block',
                    }} />
                    <span style={{
                      fontSize: '0.88rem', fontWeight: checked ? 700 : 400,
                      color: checked ? '#ff7011' : '#334155',
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
    title: 'Fireworks & Crackers Shop – Sri Veera Fireworks | Sivakasi',
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
    <div style={{ minHeight: '100vh', background: 'rgb(255,251,235)' }}>

      <TopBar />

      <Header />

      {/* ── Page title bar ───────────────────────────────────────────── */}
      <div style={{ background: 'rgb(255,251,235)', borderBottom: '1px solid #e9d97a', padding: '14px 0' }}>
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
                onFocus={e => e.target.style.borderColor = '#ff7011'}
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
                background: '#ff7011', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <SlidersVertical size={16} /> Filters
              {hasAnyFilter && (
                <span style={{ background: '#fff', color: '#ff7011', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
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
              background: 'rgb(255,251,235)', borderRadius: '20px 20px 0 0',
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
                  <div key={i} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f1f1f1', display: 'flex', flexDirection: 'column' }}>
                    {/* image area */}
                    <div style={{ padding: '8px 8px 0' }}>
                      <div style={{ background: '#f5f5f7', borderRadius: 12, padding: 12 }}>
                        <div className="skeleton" style={{ height: 160, borderRadius: 8 }} />
                      </div>
                    </div>
                    {/* card body */}
                    <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="skeleton" style={{ height: 10, width: '45%', borderRadius: 6 }} />
                      <div className="skeleton" style={{ height: 15, borderRadius: 6 }} />
                      <div className="skeleton" style={{ height: 10, width: '35%', borderRadius: 6 }} />
                      <div style={{ flex: 1, minHeight: 8 }} />
                      <div className="skeleton" style={{ height: 20, width: '50%', borderRadius: 6 }} />
                      <div className="skeleton" style={{ height: 38, borderRadius: 999, marginTop: 4 }} />
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
                  style={{ background: '#ff7011', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}
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
