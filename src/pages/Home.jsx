import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Heart, Clock, ThumbsUp, Tag, Package, ChevronRight, ChevronLeft,
} from 'lucide-react'
import { useShop } from '../context/ShopContext'
import Footer from '../components/Footer'
import TopBar from '../components/TopBar'
import Header from '../components/Header'
import useSEO from '../utils/useSEO'
import '../App.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY



// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseImages(imgUrl) {
  if (!imgUrl) return []
  try { const a = JSON.parse(imgUrl); return Array.isArray(a) ? a : [imgUrl] }
  catch { return [imgUrl] }
}

function fmtPrice(v) {
  return '₹' + parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })
}


// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product }) {
  const { addToCart, cartQtys, setQty, toggleWishlist, isWishlisted } = useShop()
  const navigate   = useNavigate()
  const imgs      = parseImages(product.image_url)
  const qty       = cartQtys[product.id] || 0
  const wishlisted = isWishlisted(product.id)
  const price  = parseFloat(product.price || 0)
  const mrp    = parseFloat(product.mrp || 0)
  const offerPct = product.discount_percentage > 0
    ? product.discount_percentage
    : (mrp > price && price > 0 ? Math.round((1 - price / mrp) * 100) : 0)
  const hasMrp = mrp > price

  return (
    <div
      className="product-box rounded-lg overflow-hidden shadow-sm bg-white transition-transform hover:-translate-y-1 hover:shadow-md flex flex-col h-full"
      onClick={() => navigate(`/products/${product.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="img-wrapper relative">
        <div className="img-host">
          <img src={imgs[0] || '/images/noimage.jpg'} alt={product.name} loading="lazy" />
          {offerPct > 0 && (
            <div className="label-block">
              <span className="label-theme">{offerPct}% Off</span>
            </div>
          )}
          <button
            className="wishlist-heart-btn"
            onClick={e => { e.stopPropagation(); toggleWishlist(product.id) }}
            title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={16} fill={wishlisted ? '#ef4444' : 'none'} color={wishlisted ? '#ef4444' : '#999'} />
          </button>
        </div>
      </div>
      <div className="product-style-6 px-3 pt-2 pb-1 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-gray-800 leading-tight mb-0.5">{product.name}</h3>
        {product.description && (
          <p className="text-[11px] text-gray-500 leading-tight mb-1" style={{ fontFamily: 'inherit' }}>{product.description}</p>
        )}
        <p className="price-box">
          {fmtPrice(product.price)}
          {hasMrp && <del> {fmtPrice(product.mrp)}</del>}
        </p>
        {product.order_unit && <p className="text-[11px] text-gray-400 mt-0.5">{product.order_unit}</p>}
        <div className="flex-1" />
      </div>
      <div className="px-3 pb-3 pt-1">
        {!product.is_active ? (
          <button disabled style={{ width: '100%', background: '#e2e8f0', color: '#94a3b8', border: 'none', borderRadius: 6, padding: '9px 0', fontSize: '0.88rem', fontWeight: 700, cursor: 'not-allowed' }}>
            Out of Stock
          </button>
        ) : qty === 0 ? (
          <button className="btn-add-cart" onClick={e => { e.stopPropagation(); addToCart(product.id) }}>Add to Cart</button>
        ) : (
          <div className="qty-row" onClick={e => e.stopPropagation()}>
            <button onClick={() => setQty(product.id, qty - 1)}>−</button>
            <input
              type="number"
              value={qty}
              min={1}
              onChange={e => {
                const v = parseInt(e.target.value)
                if (!isNaN(v) && v > 0) setQty(product.id, v)
              }}
            />
            <button onClick={() => setQty(product.id, qty + 1)}>+</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function Home() {
  useSEO({
    title: 'Sanvika Crackers | Buy Crackers Online – Sivakasi',
    description: 'Buy premium quality fireworks and crackers online from Sanvika Crackers, Sivakasi. Huge collection of sparklers, rockets, bombs, fancy items. Best prices, safe delivery across Tamil Nadu and all India.',
    url: '/',
  })

  const { products, loading, siteSettings } = useShop()

  // ── Hero banners from Supabase ─────────────────────────────────────────────
  const [banners, setBanners] = useState([])
  const [bannerLoading, setBannerLoading] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)
  const slideTimer = useRef(null)

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/hero_banners?select=*&order=sort_order.asc,created_at.asc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length) setBanners(data) })
      .finally(() => setBannerLoading(false))
  }, [])

  useEffect(() => {
    if (banners.length < 2) return
    slideTimer.current = setInterval(() => {
      setActiveSlide(s => (s + 1) % banners.length)
    }, 4000)
    return () => clearInterval(slideTimer.current)
  }, [banners.length])

  function goSlide(n) {
    clearInterval(slideTimer.current)
    setActiveSlide((activeSlide + n + banners.length) % banners.length)
  }

  // Group products by category, preserving PDF order (first product_code seen per category)
  const categoryOrder = []
  const categoryMap   = {}
  products.forEach(p => {
    if (!categoryMap[p.category]) {
      categoryMap[p.category] = []
      categoryOrder.push(p.category)
    }
    categoryMap[p.category].push(p)
  })

  // ── Showcase categories (top 6) ───────────────────────────────────────────
  const showcaseCategories = categoryOrder.slice(0, 6)

  // ── Circular product images for Welcome section ───────────────────────────
  const welcomeImg1 = products.length > 0 ? parseImages(products[0]?.image_url)[0] : null
  const welcomeImg2 = products.length > 1 ? parseImages(products[1]?.image_url)[0] : null

  return (
    <div className="theme-color4 light ltr" id="home">

      <TopBar />

      <Header />

      {/* ── Banner Skeleton ────────────────────────────────────────── */}
      {bannerLoading && (
        <div className="skeleton-banner-wrap">
          <div className="skeleton skeleton-banner" />
          <div className="skeleton-banner-dots">
            {[0, 1, 2].map(i => (
              <div key={i} className={`skeleton skeleton-banner-dot ${i === 0 ? 'active' : ''}`} />
            ))}
          </div>
        </div>
      )}

      {/* ── Hero Banner Carousel ───────────────────────────────────── */}
      {!bannerLoading && banners.length > 0 && (
        <section style={{ position: 'relative', overflow: 'hidden', background: '#111', width: '100%' }}>
          <div style={{ display: 'flex', transition: 'transform 0.5s ease', transform: `translateX(-${activeSlide * 100}%)` }}>
            {banners.map((b, i) => (
              <img
                key={b.id}
                src={b.image_url}
                alt={b.title || `Banner ${i + 1}`}
                style={{ minWidth: '100%', width: '100%', display: 'block', maxHeight: 600, objectFit: 'cover' }}
              />
            ))}
          </div>
          {banners.length > 1 && (
            <>
              <button onClick={() => goSlide(-1)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111827' }}>
                <ChevronLeft size={22} />
              </button>
              <button onClick={() => goSlide(1)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111827' }}>
                <ChevronRight size={22} />
              </button>
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                {banners.map((_, i) => (
                  <button key={i} onClick={() => setActiveSlide(i)} style={{ width: i === activeSlide ? 24 : 8, height: 8, borderRadius: 4, background: i === activeSlide ? '#0d7480' : 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.3s' }} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* ── Welcome / Intro Section ──────────────────────────────────── */}
      <section style={{ background: '#0b0b0b', padding: '72px 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 48 }}>
          {/* Left column */}
          <div style={{ flex: '1 1 380px', minWidth: 0 }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1.2, margin: '0 0 20px' }}>
              Welcome to Sanvika Crackers
            </h2>
            <p style={{ color: '#a0aec0', fontSize: '1rem', lineHeight: 1.8, margin: '0 0 20px' }}>
              Sanvika Crackers is a trusted factory outlet based in Sivakasi, Tamil Nadu — the fireworks capital of India.
              We manufacture and sell premium quality fireworks directly to customers at factory prices,
              cutting out middlemen so you always get the best value.
            </p>
            <p style={{ color: '#fcb326', fontWeight: 700, fontSize: '1rem', margin: '0 0 16px', letterSpacing: '0.03em' }}>
              127+ Products &nbsp;·&nbsp; 21 Categories &nbsp;·&nbsp; Factory Direct
            </p>
            <p style={{ color: '#718096', fontSize: '0.88rem', margin: '0 0 28px' }}>
              Minimum order applies. Contact us for bulk pricing and special rates.
            </p>
            <Link
              to="/products"
              style={{
                display: 'inline-block',
                background: '#0d7480',
                color: '#fff',
                padding: '12px 32px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.97rem',
                textDecoration: 'none',
                letterSpacing: '0.04em',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#0a5c66'}
              onMouseLeave={e => e.currentTarget.style.background = '#0d7480'}
            >
              Shop Now
            </Link>
          </div>

          {/* Right column */}
          <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, position: 'relative' }}>
            {/* Dot grid decoration — top-right */}
            <div style={{ position: 'absolute', top: -20, right: -10, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, opacity: 0.5, zIndex: 0 }}>
              {Array.from({length: 36}).map((_, i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i % 2 === 0 ? '#ff007f' : '#fcb326', display: 'block' }} />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 24, alignItems: 'center', position: 'relative', zIndex: 1 }}>
              {/* Circle image 1 */}
              <div style={{
                width: 160, height: 160, borderRadius: '50%', overflow: 'hidden',
                border: '4px solid #0d7480', flexShrink: 0,
                background: welcomeImg1 ? 'transparent' : '#1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {welcomeImg1
                  ? <img src={welcomeImg1} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fcb326', fontSize: '2rem' }}>✦</span>
                }
              </div>
              {/* Circle image 2 */}
              <div style={{
                width: 130, height: 130, borderRadius: '50%', overflow: 'hidden',
                border: '4px solid #fcb326', flexShrink: 0,
                background: welcomeImg2 ? 'transparent' : '#1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 32,
              }}>
                {welcomeImg2
                  ? <img src={welcomeImg2} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#0d7480', fontSize: '1.6rem' }}>✦</span>
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Showcase Section ────────────────────────────────── */}
      <section style={{ background: '#ffffff', padding: '72px 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 900, color: '#111111', margin: '0 0 8px' }}>
              Our Products
            </h2>
            <div style={{ width: 40, height: 3, background: '#0d7480', margin: '8px auto 0', borderRadius: 2 }} />
          </div>

          {/* 3×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {showcaseCategories.map(cat => {
              const catImg = parseImages(categoryMap[cat][0]?.image_url)[0]
              return (
                <Link
                  key={cat}
                  to="/products"
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div style={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#111',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => {
                      const overlay = e.currentTarget.querySelector('.cat-overlay')
                      if (overlay) overlay.style.opacity = '1'
                      const underline = e.currentTarget.querySelector('.cat-underline')
                      if (underline) underline.style.width = '60px'
                    }}
                    onMouseLeave={e => {
                      const overlay = e.currentTarget.querySelector('.cat-overlay')
                      if (overlay) overlay.style.opacity = '0'
                      const underline = e.currentTarget.querySelector('.cat-underline')
                      if (underline) underline.style.width = '24px'
                    }}
                  >
                    {catImg
                      ? <img src={catImg} alt={cat} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }} />
                      : <div style={{ width: '100%', height: '100%', background: '#222' }} />
                    }
                    {/* Gradient overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.18) 50%, transparent 100%)',
                    }} />
                    {/* Hover tint overlay */}
                    <div className="cat-overlay" style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(232,115,22,0.15)',
                      opacity: 0,
                      transition: 'opacity 0.3s',
                    }} />
                    {/* Category name */}
                    <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18 }}>
                      <p style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', margin: '0 0 6px', lineHeight: 1.3 }}>{cat}</p>
                      <span className="cat-underline" style={{
                        display: 'block', height: 3, width: 24,
                        background: '#0d7480', borderRadius: 2,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Band ─────────────────────────────────────────────────── */}
      <section style={{ background: '#0d7480', padding: '52px 16px' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24,
        }}>
          <div style={{ flex: '1 1 300px' }}>
            <h2 style={{ color: '#ffffff', fontWeight: 900, fontSize: 'clamp(1.4rem, 3vw, 2rem)', margin: '0 0 10px', lineHeight: 1.25 }}>
              Explore Sanvika Crackers
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1rem', margin: 0, lineHeight: 1.7 }}>
              Direct from Sivakasi factory. Shop quality crackers at the best prices.
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <Link
              to="/products"
              style={{
                display: 'inline-block',
                background: '#111111',
                color: '#ffffff',
                padding: '14px 36px',
                borderRadius: 8,
                fontWeight: 800,
                fontSize: '1rem',
                textDecoration: 'none',
                letterSpacing: '0.04em',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#222222'}
              onMouseLeave={e => e.currentTarget.style.background = '#111111'}
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── Skeleton Loader ──────────────────────────────────────────── */}
      {loading && [0, 1, 2].map(s => (
        <section key={s} className="py-10 overflow-hidden" style={{ background: s % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
          <div className="skeleton-section">
            <div className="skeleton-heading">
              <div className="skeleton skeleton-heading-sub" />
              <div className="skeleton skeleton-heading-main" />
            </div>
            <div className="skeleton-grid">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton skeleton-card-img" />
                  <div className="skeleton skeleton-card-line1" />
                  <div className="skeleton skeleton-card-line2" />
                  <div className="skeleton skeleton-card-btn" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ── Products by Category ─────────────────────────────────────── */}
      {categoryOrder.map((cat, idx) => (
        <section
          key={cat}
          id={idx === 0 ? 'products' : undefined}
          className={`py-10 overflow-hidden`} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}
        >
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="text-center mb-8">
              <p className="subtitle-two">Sanvika Crackers</p>
              <h2 className="text-3xl font-extrabold text-gray-900">{cat}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 items-stretch">
              {categoryMap[cat].map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      ))}


      {/* ── Services ────────────────────────────────────────────────── */}
      <section className="py-10" style={{ background: '#f9fafb' }}>
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { icon: <Clock size={32} color="#0d7480" />,    title: '24hrs Shipping',  sub: 'At Season Time' },
              { icon: <ThumbsUp size={32} color="#0d7480" />, title: '100%',            sub: 'Satisfied Guarantee' },
              { icon: <Package size={32} color="#0d7480" />,  title: '30+ Varieties',   sub: 'More than 200+ Products' },
              { icon: <Tag size={32} color="#0d7480" />,      title: 'Low Price',       sub: 'Available in Low Price' },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="service-wrap">
                <div className="service-icon">{icon}</div>
                <div>
                  <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3>
                  <span className="text-sm text-gray-500">{sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

    </div>
  )
}
