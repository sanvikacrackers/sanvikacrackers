import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, X } from 'lucide-react'
import { useShop } from '../context/ShopContext'
import TopBar from '../components/TopBar'
import Header from '../components/Header'
import Footer from '../components/Footer'
import '../App.css'

function parseImages(imgUrl) {
  if (!imgUrl) return []
  try { const a = JSON.parse(imgUrl); return Array.isArray(a) ? a : [imgUrl] }
  catch { return [imgUrl] }
}

function fmtPrice(v) {
  return '₹' + parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })
}

export default function Wishlist() {
  const { wishlistItems, toggleWishlist, addToCart, setQty, cartQtys } = useShop()

  return (
    <div className="theme-color4 light ltr" style={{ minHeight: '100vh', background: '#ffffff' }}>
      <TopBar />
      <Header />


      <div className="max-w-[1100px] mx-auto px-4 py-10">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
          My Wishlist {wishlistItems.length > 0 && <span className="text-[#843F43]">({wishlistItems.length} items)</span>}
        </h1>

        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <div className="flex justify-center mb-4"><Heart size={64} color="#d1d5db" /></div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Tap the heart icon on any product to save it here.</p>
            <Link to="/" className="inline-block bg-[#843F43] text-white rounded-lg px-8 py-3 font-semibold hover:bg-[#70363A] transition-colors no-underline">
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
                      <X size={14} color="#843F43" />
                    </button>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="font-bold text-gray-800 text-sm leading-tight mb-0.5">{p.name}</div>
                    {p.description && <div className="text-xs text-gray-400 mb-2">{p.description}</div>}
                    <div className="text-[#843F43] font-bold mb-1">{fmtPrice(p.price)}</div>
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
                          <Link to="/cart" className="text-xs text-[#843F43] font-semibold no-underline flex items-center gap-0.5">View Cart <ShoppingCart size={12} /></Link>
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
