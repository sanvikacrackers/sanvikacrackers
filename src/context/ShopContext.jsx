import { createContext, useContext, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const CART_KEY     = 'sanvikacrackers_cart_qtys'
const WISHLIST_KEY = 'sanvikacrackers_wishlist'

const API_HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const [cartQtys,    setCartQtys]    = useState(() => {
    try { const s = localStorage.getItem(CART_KEY);     return s ? JSON.parse(s) : {} }     catch { return {} }
  })
  const [wishlistIds, setWishlistIds] = useState(() => {
    try { const s = localStorage.getItem(WISHLIST_KEY); return s ? JSON.parse(s) : [] } catch { return [] }
  })

  // ── Persist cart & wishlist to localStorage ─────────
  useEffect(() => { localStorage.setItem(CART_KEY,     JSON.stringify(cartQtys)) },    [cartQtys])
  useEffect(() => { localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistIds)) }, [wishlistIds])

  // ── Products + site settings ─────────────────────────
  // staleTime: 5 min — cached in memory, no loading flicker on revisit
  const { data: catalogData, isLoading: loading } = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const [productsRes, settingsRes] = await Promise.all([
        fetch(
          `${SUPABASE_URL}/rest/v1/products?select=id,product_code,name,description,category,price,mrp,discount_percentage,image_url,order_unit,barcode,is_active&order=product_code.asc`,
          { headers: API_HEADERS }
        ),
        fetch(
          `${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&limit=1`,
          { headers: API_HEADERS }
        ),
      ])

      let products = []
      let siteSettings = { min_order_tn: 0, min_order_other: 0, pricelist_url: '', whatsapp: '', state_label_tn: '', state_label_other: '', announcement: '' }

      if (productsRes.ok) {
        const data = await productsRes.json()
        products = data
          .filter(p => p.is_active !== undefined)
          .sort((a, b) => (parseInt(a.product_code) || 0) - (parseInt(b.product_code) || 0))
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        siteSettings = { ...siteSettings, ...(data?.[0] || {}) }
      }

      return { products, siteSettings }
    },
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  })

  // ── Hero banners ────────────────────────────────────
  const { data: heroBanners = [], isLoading: heroBannersLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/hero_banners?select=id,image_url,title,target_url,sort_order&order=sort_order.asc,created_at.asc`,
        { headers: API_HEADERS }
      )
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  })

  const products     = catalogData?.products     || []
  const siteSettings = catalogData?.siteSettings || { min_order_tn: 0, min_order_other: 0, pricelist_url: '', whatsapp: '', state_label_tn: '', state_label_other: '', announcement: '' }

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
      products, loading,
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
