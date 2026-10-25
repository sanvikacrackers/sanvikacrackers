import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, MapPin, Mail, Send } from 'lucide-react'
import { useShop } from '../context/ShopContext'
import Footer from '../components/Footer'
import TopBar from '../components/TopBar'
import Header from '../components/Header'
import contactImg from '../assets/contactus.png'
import useSEO from '../utils/useSEO'
import '../App.css'



export default function Contact() {
  useSEO({
    title: 'Contact Sanvika Crackers | Sivakasi – 83000 57711',
    description: 'Contact Sanvika Crackers at 83000 57711. Shop at 1/204-6, NH-07, Chatram Road, Vachakkarapatti, Virudhunagar District. WhatsApp order enquiries welcome.',
    url: '/contact',
  })
  const { siteSettings } = useShop()
  const [form, setForm]   = useState({ name: '', phone: '', email: '', message: '' })
  const [sent, setSent]   = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    const text = `Hello Sanvika Crackers!%0A%0AName: ${form.name}%0APhone: ${form.phone}%0AEmail: ${form.email}%0A%0AMessage: ${form.message}`
    const wa   = siteSettings?.whatsapp || '918300057711'
    window.open(`https://api.whatsapp.com/send?phone=${wa}&text=${text}`, '_blank')
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  const wa = siteSettings?.whatsapp || '918300057711'

  const infoBoxes = [
    {
      icon: <MapPin size={22} color="#ffffff" />,
      title: 'Address',
      content: (
        <p style={{ margin: 0, fontSize: '0.93rem', color: '#475569', lineHeight: 1.7 }}>
          SANVIKA CRACKERS<br />1/204-6, NH-07, Chatram Road,<br />Vachakkarapatti, RR Nagar,<br />Virudhunagar District - 626204
        </p>
      ),
    },
    {
      icon: <Phone size={22} color="#ffffff" />,
      title: 'Mobile',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['83000 57711'].map(n => (
            <a key={n} href={`tel:+91${n.replace(/\s/g,'')}`}
              style={{ fontSize: '0.93rem', color: '#475569', textDecoration: 'none', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.color = '#BE185D'}
              onMouseLeave={e => e.currentTarget.style.color = '#475569'}
            >+91 {n}</a>
          ))}
        </div>
      ),
    },
    {
      icon: <Mail size={22} color="#ffffff" />,
      title: 'Email',
      content: (
        <a href="mailto:sanvikacrackers2020@gmail.com"
          style={{ fontSize: '0.93rem', color: '#475569', textDecoration: 'none', wordBreak: 'break-all' }}
          onMouseEnter={e => e.currentTarget.style.color = '#BE185D'}
          onMouseLeave={e => e.currentTarget.style.color = '#475569'}
        >
          sanvikacrackers2020@gmail.com
        </a>
      ),
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>

      <TopBar />

      <Header />

      {/* ── Hero Section ── */}
      <section style={{ background: '#1E1B4B', padding: '72px 16px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ color: '#BE185D', fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 14px' }}>
            Get In Touch
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1.2, margin: '0 0 16px' }}>
            Contact Us
          </h1>
          <p style={{ color: '#a0aec0', fontSize: '1.05rem', margin: 0, lineHeight: 1.7 }}>
            We'd love to hear from you. Reach out for orders, bulk enquiries, or any questions about our products.
          </p>
        </div>
      </section>

      {/* ── 3 Contact Info Cards ── */}
      <section style={{ background: '#ffffff', padding: '60px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {infoBoxes.map(box => (
              <div key={box.title} style={{
                background: '#ffffff',
                borderRadius: 14,
                padding: '32px 28px',
                border: '1px solid #e8e8e8',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}>
                {/* Icon in orange circle */}
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: '#BE185D',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {box.icon}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    {box.title}
                  </h3>
                  {box.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Map + Form ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 72px' }}>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Map */}
          <div style={{ flex: '1 1 340px', minWidth: 280 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Our Location</h2>
            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', marginBottom: 14 }}>
              <iframe
                title="Sanvika Crackers Location"
                src="https://maps.google.com/maps?q=9.4672358,77.9356098&z=16&output=embed"
                width="100%"
                height="300"
                style={{ border: 0, display: 'block' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div style={{
              background: '#fff', borderRadius: 12, padding: '14px 16px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <MapPin size={18} color="#BE185D" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Sanvika Crackers</p>
                <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  1/204-6, NH-07, Chatram Road,<br />Vachakkarapatti, RR Nagar,<br />Virudhunagar District - 626204
                </p>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=9.4672358,77.9356098"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#BE185D', color: '#fff', textDecoration: 'none',
                    borderRadius: 8, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700,
                  }}
                >
                  <MapPin size={14} /> Get Directions
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Send a Message</h2>
            <div style={{
              background: '#fff', borderRadius: 16, padding: 24,
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9',
            }}>
              {sent ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h3 style={{ color: '#059669', margin: '0 0 6px' }}>Message Sent!</h3>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>We'll get back to you on WhatsApp shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 5 }}>Your Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Enter your name"
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                        border: '1px solid #e2e8f0', borderRadius: 10,
                        fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                      }}
                      onFocus={e => e.target.style.borderColor = '#BE185D'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 5 }}>Phone Number *</label>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 XXXXX XXXXX"
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                        border: '1px solid #e2e8f0', borderRadius: 10,
                        fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                      }}
                      onFocus={e => e.target.style.borderColor = '#BE185D'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 5 }}>Email (optional)</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="your@email.com"
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                        border: '1px solid #e2e8f0', borderRadius: 10,
                        fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                      }}
                      onFocus={e => e.target.style.borderColor = '#BE185D'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 5 }}>Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Write your enquiry or order details..."
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                        border: '1px solid #e2e8f0', borderRadius: 10,
                        fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                        resize: 'vertical',
                      }}
                      onFocus={e => e.target.style.borderColor = '#BE185D'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: '#25d366', color: '#fff', border: 'none',
                      borderRadius: 10, padding: '12px 0', fontSize: '0.95rem', fontWeight: 700,
                      cursor: 'pointer', transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1da851'}
                    onMouseLeave={e => e.currentTarget.style.background = '#25d366'}
                  >
                    <Send size={16} /> Send via WhatsApp
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
