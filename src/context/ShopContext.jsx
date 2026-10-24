import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const CART_KEY     = 'sriveerafireworks_cart_qtys'
const WISHLIST_KEY = 'sriveerafireworks_wishlist'

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const [products, setProducts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [cartQtys, setCartQtys]         = useState({})
  const [wishlistIds, setWishlistIds]   = useState([])
  const [siteSettings, setSiteSettings] = useState({
    min_order_tn: 0,
    min_order_other: 0,
    pricelist_url: '',
    whatsapp: '',
    state_label_tn: '',
    state_label_other: '',
    announcement: '',
  })

  // ── Load cart & wishlist from localStorage ────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY)
      if (saved) setCartQtys(JSON.parse(saved))
    } catch { /* ignore */ }
    try {
      const saved = localStorage.getItem(WISHLIST_KEY)
      if (saved) setWishlistIds(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  // ── Persist cart to localStorage ─────────────────
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartQtys))
  }, [cartQtys])

  // ── Persist wishlist to localStorage ─────────────
  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistIds))
  }, [wishlistIds])

  // ── Fetch products from Supabase ──────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/products?order=product_code.asc`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      )
      if (res.ok) {
        const data = await res.json()
        // Site settings row
        const settingsRow = data.find(p => p.category === '__SITE_SETTINGS__')
        if (settingsRow?.description) {
          try { setSiteSettings(s => ({ ...s, ...JSON.parse(settingsRow.description) })) }
          catch { /* ignore */ }
        }
        // All public products (active + inactive), inactive shown as out of stock
        const clean = data
          .filter(p => p.category && !p.category.startsWith('__'))
          .sort((a, b) => (parseInt(a.product_code) || 0) - (parseInt(b.product_code) || 0))
        setProducts(clean)
      }
    } catch (e) {
      console.error('ShopContext fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // ── Cart helpers ─────────────────────────────────
  const setQty = (productId, qty) => {
    setCartQtys(prev => {
      if (qty <= 0) {
        const n = { ...prev }
        delete n[productId]
        return n
      }
      return { ...prev, [productId]: qty }
    })
  }

  const addToCart = (productId) => {
    setCartQtys(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }))
  }

  const removeFromCart = (productId) => {
    setCartQtys(prev => {
      const n = { ...prev }
      delete n[productId]
      return n
    })
  }

  const clearCart = () => setCartQtys({})

  // ── Wishlist helpers ──────────────────────────────
  const toggleWishlist = (productId) => {
    setWishlistIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    )
  }
  const isWishlisted = (productId) => wishlistIds.includes(productId)
  const wishlistItems = products.filter(p => wishlistIds.includes(p.id))
  const wishlistCount = wishlistItems.length

  const cartItems = products
    .filter(p => cartQtys[p.id])
    .map(p => ({ product: p, qty: cartQtys[p.id] }))

  const cartTotal = cartItems.reduce((s, i) => s + parseFloat(i.product.price || 0) * i.qty, 0)
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

  return (
    <ShopContext.Provider value={{
      products, loading, fetchProducts,
      siteSettings,
      cartItems, cartTotal, cartCount, cartQtys,
      addToCart, removeFromCart, setQty, clearCart,
      wishlistIds, wishlistItems, wishlistCount, toggleWishlist, isWishlisted,
    }}>
      {children}
    </ShopContext.Provider>
  )
}

export const useShop = () => useContext(ShopContext)
