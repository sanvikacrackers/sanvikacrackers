import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, X, ShoppingBag } from 'lucide-react'
import { useShop } from '../context/ShopContext'
import Footer from '../components/Footer'
import '../App.css'
import LOGO from '../assets/websitelogo.jpeg'

function parseImages(imgUrl) {
  if (!imgUrl) return []
  try { const a = JSON.parse(imgUrl); return Array.isArray(a) ? a : [imgUrl] }
  catch { return [imgUrl] }
}

function fmtPrice(v) {
  return '₹' + parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })
}

export default function Wishlist() {
  const { wishlistItems, toggleWishlist, addToCart, setQty, cartQtys, cartCount, wishlistCount } = useShop()

  return (
    <div className="theme-color4 light ltr" style={{ minHeight: '100vh', background: 'rgb(255,251,235)' }}>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link to="/" className="flex-shrink-0">
              <img src={LOGO} alt="Sri Veera Fireworks" className="h-10 w-auto object-contain" />
            </Link>
            <nav className="hidden lg:flex items-center gap-1">
              <Link to="/"          className="nav-link">Home</Link>
              <Link to="/about"     className="nav-link">About</Link>
              <Link to="/#products" className="nav-link">Products</Link>
              <Link to="/safety"    className="nav-link">Safety Tips</Link>
              <Link to="/#contact"  className="nav-link">Contact</Link>
            </nav>
            <div className="flex items-center gap-2">
              <Link to="/wishlist" className="relative flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-[#e87316] rounded-md px-3 py-2 text-sm font-semibold hover:bg-orange-100 transition-colors no-underline">
                <Heart size={18} fill="#e87316" />
                <span className="hidden sm:inline">Wishlist</span>
                {wishlistCount > 0 && <span className="bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">{wishlistCount}</span>}
              </Link>
              <Link to="/cart" className="flex items-center gap-1.5 bg-[#e87316] text-white border-none rounded-md px-3 py-2 text-sm font-semibold hover:bg-[#cf6512] transition-colors no-underline">
                <ShoppingCart size={18} />
                Cart {cartCount > 0 && <span className="bg-white text-[#e87316] rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">{cartCount}</span>}
              </Link>
            </div>
          </div>
        </div>
      </header>


      <div className="max-w-[1100px] mx-auto px-4 py-10">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
          My Wishlist {wishlistItems.length > 0 && <span className="text-[#e87316]">({wishlistItems.length} items)</span>}
        </h1>

        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <div className="flex justify-center mb-4"><Heart size={64} color="#d1d5db" /></div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Tap the heart icon on any product to save it here.</p>
            <Link to="/" className="inline-block bg-[#e87316] text-white rounded-lg px-8 py-3 font-semibold hover:bg-[#cf6512] transition-colors no-underline">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {wishlistItems.map(p => {
              const imgs = parseImages(p.image_url)
              const qty  = cartQtys[p.id] || 0
              return (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  <div className="relative">
                    <img
                      src={imgs[0] || '/images/noimage.jpg'}
                      alt={p.name}
                      className="w-full object-cover"
                      style={{ height: 180 }}
                    />
                    <button
                      className="wishlist-heart-btn"
                      onClick={() => toggleWishlist(p.id)}
                      title="Remove from wishlist"
                    >
                      <X size={14} color="#e87316" />
                    </button>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="font-bold text-gray-800 text-sm leading-tight mb-0.5">{p.name}</div>
                    {p.description && <div className="text-xs text-gray-400 mb-2">{p.description}</div>}
                    <div className="text-[#e87316] font-bold mb-1">{fmtPrice(p.price)}</div>
                    {p.order_unit && <div className="text-xs text-gray-400 mb-3">{p.order_unit}</div>}
                    <div className="mt-auto">
                      {qty === 0 ? (
                        <button className="btn-add-cart w-full" onClick={() => addToCart(p.id)}>Add to Cart</button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="qty-row flex-1">
                            <button onClick={() => setQty(p.id, qty - 1)}>−</button>
                            <input
                              type="number"
                              value={qty}
                              min={1}
                              onChange={e => {
                                const v = parseInt(e.target.value)
                                if (!isNaN(v) && v > 0) setQty(p.id, v)
                              }}
                            />
                            <button onClick={() => setQty(p.id, qty + 1)}>+</button>
                          </div>
                          <Link to="/cart" className="text-xs text-[#e87316] font-semibold no-underline flex items-center gap-0.5">View Cart <ShoppingCart size={12} /></Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
