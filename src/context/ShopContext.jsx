import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const CART_KEY     = 'sanvikacrackers_cart_qtys'
const WISHLIST_KEY = 'sanvikacrackers_wishlist'
const CATALOG_KEY  = 'sanvikacrackers_catalog'
const BANNERS_KEY  = 'sanvikacrackers_banners'
const CACHE_TTL    = 5 * 60 * 1000 // 5 minutes

const API_HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(key); return null }
    return data
  } catch { return null }
}

function writeCache(key, data) {
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  // Serve from cache immediately so loading flicker is minimal
  const cachedCatalog = readCache(CATALOG_KEY)
  const cachedBanners = readCache(BANNERS_KEY)

  const [products, setProducts]           = useState(cachedCatalog?.products || [])
  const [siteSettings, setSiteSettings]   = useState(cachedCatalog?.siteSettings || {
    min_order_tn: 0, min_order_other: 0, pricelist_url: '',
    whatsapp: '', state_label_tn: '', state_label_other: '', announcement: '',
  })
  const [loading, setLoading]             = useState(!cachedCatalog)
  const [heroBanners, setHeroBanners]     = useState(cachedBanners || [])
  const [heroBannersLoading, setHeroBannersLoading] = useState(!cachedBanners)

  const [cartQtys, setCartQtys]           = useState({})
  const [wishlistIds, setWishlistIds]     = useState([])

  const fetchedRef = useRef(false)
  const bannerFetchedRef = useRef(!!cachedBanners)

  // ── Load cart & wishlist from localStorage ──────────
  useEffect(() => {
    try { const s = localStorage.getItem(CART_KEY);     if (s) setCartQtys(JSON.parse(s)) }     catch {}
    try { const s = localStorage.getItem(WISHLIST_KEY); if (s) setWishlistIds(JSON.parse(s)) } catch {}
  }, [])

  // ── Persist cart & wishlist to localStorage ─────────
  useEffect(() => { localStorage.setItem(CART_KEY,     JSON.stringify(cartQtys)) },    [cartQtys])
  useEffect(() => { localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistIds)) }, [wishlistIds])

  // ── Fetch products + settings (stale-while-revalidate) ──
  const fetchProducts = useCallback(async (force = false) => {
    if (!force && fetchedRef.current) return
    fetchedRef.current = true
    if (!cachedCatalog) setLoading(true)
    try {
      const [productsRes, settingsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/products?select=id,product_code,name,description,category,price,mrp,discount_percentage,image_url,order_unit,barcode,is_active&order=product_code.asc`, { headers: API_HEADERS }),
        fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&limit=1`,                                                                                                                   { headers: API_HEADERS }),
      ])
      if (productsRes.ok) {
        const data = await productsRes.json()
        const clean = data
          .filter(p => p.category && p.is_active !== undefined)
          .sort((a, b) => (parseInt(a.product_code) || 0) - (parseInt(b.product_code) || 0))
        setProducts(clean)
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          const settings = settingsData?.[0] || {}
          setSiteSettings(s => ({ ...s, ...settings }))
          writeCache(CATALOG_KEY, { products: clean, siteSettings: settings })
        }
      }
    } catch (e) {
      console.error('ShopContext fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // ── Fetch hero banners once per session ─────────────
  useEffect(() => {
    if (bannerFetchedRef.current) return
    bannerFetchedRef.current = true
    fetch(
      `${SUPABASE_URL}/rest/v1/hero_banners?select=id,image_url,alt_text,link_url,sort_order&order=sort_order.asc,created_at.asc`,
      { headers: API_HEADERS }
    )
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length) {
          setHeroBanners(data)
          writeCache(BANNERS_KEY, data)
        }
      })
      .catch(() => {})
      .finally(() => setHeroBannersLoading(false))
  }, [])

  // ── Cart helpers ────────────────────────────────────
  const setQty = (productId, qty) => {
    setCartQtys(prev => {
      if (qty <= 0) { const n = { ...prev }; delete n[productId]; return n }
      return { ...prev, [productId]: qty }
    })
  }
  const addToCart      = (productId) => setCartQtys(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }))
  const removeFromCart = (productId) => setCartQtys(prev => { const n = { ...prev }; delete n[productId]; return n })
  const clearCart      = () => setCartQtys({})
  const clearWishlist  = () => setWishlistIds([])

  // ── Wishlist helpers ────────────────────────────────
  const toggleWishlist = (productId) => setWishlistIds(prev =>
    prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
  )
  const isWishlisted = (productId) => wishlistIds.includes(productId)

  // ── Computed values ─────────────────────────────────
  const wishlistItems = products.filter(p => wishlistIds.includes(p.id))
  const wishlistCount = wishlistItems.length
  const cartItems     = products.filter(p => cartQtys[p.id]).map(p => ({ product: p, qty: cartQtys[p.id] }))
  const cartTotal     = cartItems.reduce((s, i) => s + parseFloat(i.product.price || 0) * i.qty, 0)
  const cartCount     = cartItems.reduce((s, i) => s + i.qty, 0)

  return (
    <ShopContext.Provider value={{
      products, loading, fetchProducts,
      siteSettings,
      heroBanners, heroBannersLoading,
      cartItems, cartTotal, cartCount, cartQtys,
      addToCart, removeFromCart, setQty, clearCart, clearWishlist,
      wishlistIds, wishlistItems, wishlistCount, toggleWishlist, isWishlisted,
    }}>
      {children}
    </ShopContext.Provider>
  )
}

export const useShop = () => useContext(ShopContext)
