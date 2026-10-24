import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, CheckCircle2, MessageCircle, ShoppingBag } from 'lucide-react'
import { useShop } from '../context/ShopContext'
import Footer from '../components/Footer'
import Header from '../components/Header'
import OrderToast from '../components/OrderToast'
import { generateOrderPDF } from '../utils/generateOrderPDF'
import useSEO from '../utils/useSEO'
import '../App.css'
import paymentImg from '../assets/payment.jpeg'
import gpayImg from '../assets/gpay.jpeg'



function parseImages(imgUrl) {
  if (!imgUrl) return []
  try { const a = JSON.parse(imgUrl); return Array.isArray(a) ? a : [imgUrl] }
  catch { return [imgUrl] }
}

function fmtPrice(v) {
  return '₹' + parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })
}

export default function Cart() {
  useSEO({
    title: 'Your Cart – Sri Veera Fireworks',
    description: 'Review your fireworks order and send a WhatsApp enquiry to Sri Veera Fireworks.',
    url: '/cart',
    noIndex: true,
  })

  const { cartItems, cartTotal, cartCount, setQty, removeFromCart, clearCart, siteSettings } = useShop()
  const labelTN    = siteSettings.state_label_tn
  const labelOther = siteSettings.state_label_other
  const [form, setForm]       = useState({ name: '', phone: '', address: '', isTN: true })
  const [formErr, setFormErr] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [errorToast, setErrorToast] = useState({ show: false, message: '' })

  const setF = (k, v) => { setForm(f => ({ ...f, [k]: v })); setFormErr(e => ({ ...e, [k]: false })) }

  const minOrder = form.isTN
    ? parseFloat(siteSettings.min_order_tn || 3000)
    : parseFloat(siteSettings.min_order_other || 5000)

  const handleEnquiry = async (e) => {
    e.preventDefault()
    const errs = {
      name:    !form.name.trim(),
      phone:   !form.phone.trim() || !/^\d{10}$/.test(form.phone.trim()),
      address: !form.address.trim(),
    }
    if (errs.name || errs.phone || errs.address) { setFormErr(errs); return }
    if (cartTotal < minOrder) {
      setErrorToast({ show: true, message: `Minimum order is ₹${minOrder.toLocaleString('en-IN')} for ${form.isTN ? labelTN : labelOther}.` })
      return
    }

    const lines = cartItems.map(i =>
      `• ${i.product.name} × ${i.qty} = INR ${(i.product.price * i.qty).toLocaleString('en-IN')}`
    ).join('\n')
    const msg = [
      '*ORDER ENQUIRY — Sri Veera Fireworks*',
      '',
      `*Name:* ${form.name}`,
      `*Phone:* ${form.phone}`,
      `*State:* ${form.isTN ? labelTN : labelOther}`,
      `*Address:* ${form.address}`,
      '',
      '*Items:*',
      lines,
      '',
      `*Total: INR ${cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*`,
      '',
      '_Sent from sriveerafireworks.com_',
    ].join('\n')

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
    const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

    // Save order first to get the order ID for the PDF
    let orderNo = null
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          customer_name: form.name,
          phone: form.phone,
          address: `[${form.isTN ? labelTN : labelOther}] ${form.address}`,
          items: JSON.stringify(cartItems.map(i => ({
            product_code: i.product.product_code,
            name: i.product.name,
            quantity: i.qty,
            price: parseFloat(i.product.price || 0),
            mrp: parseFloat(i.product.mrp || i.product.price || 0),
            discount_percentage: parseFloat(i.product.discount_percentage || 0),
            unit: i.product.order_unit || '',
          }))),
          total: cartTotal,
          status: 'Payment Pending',
        }),
      })
      const saved = await res.json()
      orderNo = Array.isArray(saved) ? saved[0]?.id : saved?.id
    } catch {}

    // Generate and download PDF with the order ID
    await generateOrderPDF({ form, cartItems, cartTotal, estimateNo: orderNo })

    const wa = siteSettings.whatsapp || '918300057711'
    setTimeout(() => {
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank')
    }, 600)

    clearCart()
    setSubmitted(true)
    setShowToast(true)
  }

  return (
    <div className="theme-color4 light ltr" style={{ minHeight: '100vh', background: 'rgb(255,251,235)' }}>

      <Header />


      <div className="max-w-[1100px] mx-auto px-4 py-10">

        {submitted ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <div className="flex justify-center mb-4"><CheckCircle2 size={64} color="#22c55e" /></div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Enquiry Sent!</h2>
            <p className="text-gray-500 mb-6">Your enquiry has been sent via WhatsApp. Our team will contact you shortly.</p>
            <Link to="/" className="inline-block bg-[#e87316] text-white rounded-lg px-8 py-3 font-semibold hover:bg-[#cf6512] transition-colors no-underline">
              Continue Shopping
            </Link>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <div className="flex justify-center mb-4"><ShoppingBag size={64} color="#d1d5db" /></div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some crackers to get started!</p>
            <Link to="/" className="inline-block bg-[#e87316] text-white rounded-lg px-8 py-3 font-semibold hover:bg-[#cf6512] transition-colors no-underline">
              Shop Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Cart Items */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h1 className="text-2xl font-extrabold text-gray-900">Your Cart <span className="text-[#e87316]">({cartCount} items)</span></h1>
              {cartItems.map(({ product: p, qty }) => {
                const imgs = parseImages(p.image_url)
                return (
                  <div key={p.id} className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-start gap-4">
                      {/* Image */}
                      <img
                        src={imgs[0] || '/images/noimage.jpg'}
                        alt={p.name}
                        className="rounded-xl object-cover flex-shrink-0"
                        style={{ width: 80, height: 80 }}
                      />
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 text-sm leading-tight">{p.name}</div>
                        {p.description && <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>}
                        {p.order_unit && <div className="text-xs text-gray-400">{p.order_unit}</div>}
                        <div className="text-[#e87316] font-bold mt-1 text-sm">{fmtPrice(p.price)}</div>
                      </div>
                      {/* Remove */}
                      <button className="text-gray-400 hover:text-red-500 flex-shrink-0" onClick={() => removeFromCart(p.id)}>
                        <X size={18} />
                      </button>
                    </div>
                    {/* Qty + Total row */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: 8, padding: 4, gap: 0 }}>
                        <button
                          onClick={() => setQty(p.id, qty - 1)}
                          style={{ background: '#ff7011', color: '#fff', border: 'none', borderRadius: 6, width: 34, height: 34, fontSize: 20, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        >−</button>
                        <span style={{ minWidth: 40, textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{qty}</span>
                        <button
                          onClick={() => setQty(p.id, qty + 1)}
                          style={{ background: '#ff7011', color: '#fff', border: 'none', borderRadius: 6, width: 34, height: 34, fontSize: 20, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        >+</button>
                      </div>
                      <div className="text-base font-extrabold text-gray-800">{fmtPrice(p.price * qty)}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order Summary + Form */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-extrabold text-gray-900 mb-4">Order Summary</h2>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>{fmtPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  <span>Freight</span>
                  <span className="text-orange-500 font-medium">Extra</span>
                </div>
                <div className="border-t border-gray-100 pt-4 flex justify-between font-extrabold text-gray-900 text-base">
                  <span>Total</span>
                  <span className="text-[#e87316]">{fmtPrice(cartTotal)}</span>
                </div>
                <div className="mt-3 text-xs text-gray-400 bg-orange-50 rounded-lg px-3 py-2">
                  Min. order: ₹{minOrder.toLocaleString('en-IN')} ({form.isTN ? labelTN : labelOther})
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-extrabold text-gray-900 mb-4">Your Details</h2>
                <form onSubmit={handleEnquiry} className="flex flex-col gap-3">
                  <div className="cart-state-toggle">
                    <button type="button" className={form.isTN ? 'active' : ''} onClick={() => setF('isTN', true)}>{labelTN}</button>
                    <button type="button" className={!form.isTN ? 'active' : ''} onClick={() => setF('isTN', false)}>{labelOther}</button>
                  </div>
                  <input className={`cart-input ${formErr.name ? 'input-err' : ''}`} type="text" placeholder="Your Name *"
                    value={form.name} onChange={e => setF('name', e.target.value)} />
                  <input className={`cart-input ${formErr.phone ? 'input-err' : ''}`} type="tel" placeholder="10-digit Phone *"
                    value={form.phone} onChange={e => setF('phone', e.target.value)} maxLength={10} />
                  <textarea className={`cart-input ${formErr.address ? 'input-err' : ''}`} placeholder="Full Address *" rows={3}
                    value={form.address} onChange={e => setF('address', e.target.value)} />
                  <button type="submit" className="btn-wha flex items-center justify-center gap-2">
                    <MessageCircle size={18} /> Send WhatsApp Enquiry
                  </button>
                </form>
              </div>

              {/* Payment options */}
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">Accepted Payments</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <img src={paymentImg} alt="Payment Options" style={{ maxWidth: 200, width: '100%', objectFit: 'contain' }} />
                  <img src={gpayImg} alt="GPay" style={{ maxWidth: 300, width: '100%', objectFit: 'contain', borderRadius: 8 }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />

      <OrderToast show={showToast} onClose={() => setShowToast(false)} customerName={form.name} />
      <OrderToast type="error" show={errorToast.show} message={errorToast.message} onClose={() => setErrorToast({ show: false, message: '' })} />
    </div>
  )
}
