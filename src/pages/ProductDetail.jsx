import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, ShoppingCart, ArrowLeft, Tag, Package } from 'lucide-react'
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
  return '₹' + parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })
}

// ─── Mini Card for Similar Products ───────────────────────────────────────────
function SimilarCard({ product }) {
  const { addToCart, cartQtys, setQty, toggleWishlist, isWishlisted } = useShop()
  const navigate   = useNavigate()
  const imgs       = parseImages(product.image_url)
  const qty        = cartQtys[product.id] || 0
  const wishlisted = isWishlisted(product.id)
  const price  = parseFloat(product.price || 0)
  const mrp    = parseFloat(product.mrp || 0)
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
        borderRadius: 16, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        border: '1px solid #ece8e1',
        cursor: 'pointer',
        transition: 'transform 0.22s, box-shadow 0.22s',
        boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', background: '#ffffff', height: 130, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <img
          src={imgs[0] || '/images/noimage.jpg'}
          alt={product.name}
          loading="lazy"
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
        />
        {offerPct > 0 && (
          <div style={{
            position: 'absolute', top: 7, left: 7, zIndex: 3,
            background: '#843F43', color: '#ffffff',
            borderRadius: 20, padding: '3px 8px',
            fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px',
          }}>
            {offerPct}% Off
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); toggleWishlist(product.id) }}
          style={{
            position: 'absolute', top: 7, right: 7,
            background: 'rgba(255,255,255,0.9)', border: '1px solid #e5e5e5',
            borderRadius: '50%', width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10,
          }}
        >
          <Heart size={13} fill={wishlisted ? '#ef4444' : 'none'} color={wishlisted ? '#ef4444' : '#aaa'} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px 8px', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '0.65rem', color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>
          {product.category}
        </span>
        <h3 style={{ fontSize: '0.83rem', fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px', lineHeight: 1.3 }}>
          {product.name}
        </h3>
        {product.order_unit && (
          <p style={{ fontSize: '0.68rem', color: '#aaa', margin: '0 0 6px' }}>{product.order_unit}</p>
        )}
        <div style={{ flex: 1 }} />

        {/* Quantity row — when in cart */}
        {qty > 0 && (
          <div
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>Quantity</span>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #d1d5db', borderRadius: 20, overflow: 'hidden' }}>
              <button type="button" onClick={() => setQty(product.id, qty - 1)}
                style={{ width: 26, height: 26, border: 'none', background: 'transparent', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', color: '#843F43', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ minWidth: 20, textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#1a1a1a' }}>{qty}</span>
              <button type="button" onClick={() => setQty(product.id, qty + 1)}
                style={{ width: 26, height: 26, border: 'none', background: 'transparent', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', color: '#843F43', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>
        )}
      </div>

      {/* Price + Add to Cart row */}
      <div
        style={{ padding: '0 12px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#843F43', display: 'block', lineHeight: 1 }}>{fmtPrice(product.price)}</span>
          {hasMrp && (
            <span style={{ fontSize: '0.68rem', color: '#bbb', textDecoration: 'line-through', display: 'block', marginTop: 2 }}>{fmtPrice(product.mrp)}</span>
          )}
        </div>
        <AddToCartButton
          label={qty > 0 ? 'More' : 'Cart'}
          onClick={() => addToCart(product.id)}
        />
      </div>
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, cartQtys, addToCart, setQty, toggleWishlist, isWishlisted } = useShop()

  const product = products.find(p => String(p.id) === String(id))

  useSEO({
    title: product ? `${product.name} – Sanvika Crackers` : 'Product – Sanvika Crackers',
    description: product
      ? `Buy ${product.name} from Sanvika Crackers, Sivakasi. ${product.description || 'Premium quality fireworks at best prices.'}`
      : 'Premium fireworks at best prices.',
    url: product ? `/products/${product.id}` : '/products',
  })

  const [activeImg, setActiveImg] = useState(0)

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: '3rem' }}>🎆</div>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Product not found</p>
        <button onClick={() => navigate('/products')} style={{ background: '#843F43', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
          Back to Products
        </button>
      </div>
    )
  }

  const imgs     = parseImages(product.image_url)
  const qty      = cartQtys[product.id] || 0
  const wishlisted = isWishlisted(product.id)
  const savings  = product.mrp && product.discount_percentage > 0
    ? parseFloat(product.mrp) - parseFloat(product.price)
    : 0

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>

      <TopBar />

      <Header />

      {/* ── Main Detail ───────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px 48px' }}>

        {/* ── Left + Right columns ─────────────────────────────── */}
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* ══ LEFT: images ══════════════════════════════════════ */}
          <div style={{ flex: '1 1 340px', minWidth: 280, maxWidth: 520 }}>

            {/* Back button */}
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#fff', border: '1px solid #843F43', color: '#843F43',
                  borderRadius: 999, padding: '6px 16px', fontSize: '0.85rem',
                  fontWeight: 700, cursor: 'pointer', transition: '0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ffffff' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
              >
                <ArrowLeft size={14} color="#843F43" /> Back
              </button>
            </div>

            {/* Main image box */}
            <div style={{
              position: 'relative', background: '#ffffff',
              borderRadius: 16, border: '1px solid #e2e8f0',
              padding: 24, textAlign: 'center', marginBottom: 14,
            }}>
              {/* Wishlist */}
              <button
                onClick={() => toggleWishlist(product.id)}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 42, height: 42, borderRadius: '50%',
                  background: '#fff', border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 2, transition: '0.2s',
                }}
                title={wishlisted ? 'Remove from wishlist' : 'Save to Wishlist'}
              >
                <Heart size={20} fill={wishlisted ? '#ef4444' : 'none'} color={wishlisted ? '#ef4444' : '#64748b'} />
              </button>

              {/* Discount badge */}
              {product.discount_percentage > 0 && (
                <span style={{
                  position: 'absolute', top: 16, left: 16,
                  background: '#843F43', color: '#fff',
                  fontSize: '0.78rem', fontWeight: 700,
                  borderRadius: 8, padding: '4px 10px', zIndex: 2,
                }}>
                  -{product.discount_percentage}% OFF
                </span>
              )}

              {/* Image */}
              <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img
                  src={imgs[activeImg] || '/images/noimage.jpg'}
                  alt={product.name}
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* Thumbnails */}
            {imgs.length > 1 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'nowrap', overflowX: 'auto' }}>
                {imgs.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      width: 80, height: 80, flexShrink: 0,
                      borderRadius: 12, overflow: 'hidden', padding: 0,
                      border: i === activeImg ? '3px solid #843F43' : '1px solid #e2e8f0',
                      cursor: 'pointer', opacity: i === activeImg ? 1 : 0.65,
                      boxShadow: i === activeImg ? '0 4px 12px rgba(132,63,67,0.25)' : 'none',
                      transition: '0.2s', background: 'none',
                    }}
                  >
                    <img src={src} alt={`Slide ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ══ RIGHT: details ════════════════════════════════════ */}
          <div style={{ flex: '1 1 320px', minWidth: 280, display: 'flex', flexDirection: 'column' }}>

            {/* Category badge */}
            <div style={{ marginBottom: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#ffffff', color: '#843F43',
                border: '1px solid rgba(76,29,149,0.2)',
                borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600,
              }}>
                <Tag size={11} />
                {product.category}
              </span>
            </div>

            {/* Product name */}
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.25 }}>
              {product.name}
            </h1>

            {/* In Stock */}
            <div style={{ marginBottom: 16 }}>
              <span style={{
                background: '#ecfdf5', color: '#059669',
                border: '1px solid rgba(5,150,105,0.2)',
                borderRadius: 999, padding: '5px 14px', fontSize: '0.85rem', fontWeight: 600,
              }}>
                ✓ In Stock
              </span>
            </div>

            {/* Price box */}
            <div style={{
              background: '#fafafa', border: '1px solid #e2e8f0',
              borderRadius: 12, padding: 16, marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {fmtPrice(product.price)}
                </span>
                {product.discount_percentage > 0 && product.mrp && (
                  <span style={{ fontSize: '1.2rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                    {fmtPrice(product.mrp)}
                  </span>
                )}
                {product.discount_percentage > 0 && (
                  <span style={{
                    background: '#843F43', color: '#fff',
                    borderRadius: 6, padding: '4px 10px', fontSize: '0.88rem', fontWeight: 700,
                  }}>
                    SAVE {product.discount_percentage}% OFF
                  </span>
                )}
              </div>
              {savings > 0 && (
                <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.875rem', marginTop: 6 }}>
                  🎉 You save {fmtPrice(savings)} on this item!
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div style={{ marginBottom: 16, color: '#475569', fontSize: '0.92rem', lineHeight: 1.6 }}>
                {product.description}
              </div>
            )}

            {/* Order unit */}
            {product.order_unit && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Packaging &amp; Order Unit:
                </div>
                <div style={{
                  background: '#fff', border: '1px solid #e2e8f0',
                  borderRadius: 10, padding: '12px 16px',
                  display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box',
                }}>
                  <Package size={16} color="#843F43" />
                  <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{product.order_unit}</span>
                </div>
              </div>
            )}

            {/* Qty control */}
            <div style={{ marginBottom: 8 }}>
              {qty === 0 ? (
                <button
                  onClick={() => addToCart(product.id)}
                  style={{
                    width: '100%', background: '#843F43', color: '#fff',
                    border: 'none', borderRadius: 999,
                    padding: '14px 0', fontSize: '1rem', fontWeight: 700,
                    cursor: 'pointer', transition: 'background 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#70363A'}
                  onMouseLeave={e => e.currentTarget.style.background = '#843F43'}
                >
                  <ShoppingCart size={18} /> Add to Cart
                </button>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: '2px solid #843F43', borderRadius: 999,
                  minHeight: 52, padding: '0 8px', background: '#fff', width: '100%',
                  boxSizing: 'border-box',
                }}>
                  <button
                    type="button"
                    onClick={() => qty <= 1 ? setQty(product.id, 0) : setQty(product.id, qty - 1)}
                    style={{
                      width: 38, height: 38, border: 'none', background: 'transparent',
                      fontSize: '1.4rem', fontWeight: 700, cursor: 'pointer', color: '#843F43',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0,
                    }}
                  >−</button>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <input
                      type="number"
                      value={qty}
                      min={1}
                      onChange={e => {
                        const v = parseInt(e.target.value)
                        if (!isNaN(v) && v > 0) setQty(product.id, v)
                      }}
                      style={{
                        width: 50, textAlign: 'center', fontWeight: 800,
                        fontSize: '1.25rem', color: '#843F43',
                        border: 'none', background: 'transparent', outline: 'none', padding: 0, margin: 0,
                        MozAppearance: 'textfield', WebkitAppearance: 'none',
                      }}
                    />
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#843F43' }}>in Cart</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQty(product.id, qty + 1)}
                    style={{
                      width: 38, height: 38, border: 'none', background: 'transparent',
                      fontSize: '1.4rem', fontWeight: 700, cursor: 'pointer', color: '#843F43',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0,
                    }}
                  >+</button>
                </div>
              )}
            </div>

            {/* Go to cart shortcut */}
            {qty > 0 && (
              <Link to="/cart" style={{
                display: 'block', textAlign: 'center', marginTop: 10,
                color: '#843F43', fontSize: '0.88rem', fontWeight: 600,
                textDecoration: 'none',
              }}>
                View Cart →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Similar Products ─────────────────────────────────────── */}
      {(() => {
        const similar = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 8)
        if (!similar.length) return null
        return (
          <div style={{ background: '#ffffff', borderTop: '1px solid #E6DED3', padding: '40px 0' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#843F43', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  More from this category
                </p>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                  Similar Products
                </h2>
              </div>
              <div className="products-grid">
                {similar.map(p => <SimilarCard key={p.id} product={p} />)}
              </div>
            </div>
          </div>
        )
      })()}

      <Footer />
    </div>
  )
}
