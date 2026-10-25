import { Link } from 'react-router-dom'
import { Phone, MapPin, Mail } from 'lucide-react'
import { useShop } from '../context/ShopContext'
import Footer from '../components/Footer'
import TopBar from '../components/TopBar'
import Header from '../components/Header'
import aboutImg from '../assets/aboutus.png'
import useSEO from '../utils/useSEO'
import '../App.css'



export default function About() {
  useSEO({
    title: 'About Us – Sanvika Crackers | Sivakasi Crackers Manufacturer',
    description: 'Learn about Sanvika Crackers, a trusted crackers brand from Sivakasi, Tamil Nadu. Quality fireworks, 100% legal & licensed, safe packaging and delivery.',
    url: '/about',
  })

  const { } = useShop()

  return (
    <div className="theme-color4 light ltr" style={{ minHeight: '100vh', background: '#FFFBF5' }}>

      <TopBar />

      <Header />

      {/* ── Hero Section ── */}
      <section style={{ background: '#1E1B4B', padding: '72px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 48 }}>
          {/* Left text */}
          <div style={{ flex: '1 1 340px', minWidth: 0 }}>
            <p style={{ color: '#FDE68A', fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 14px' }}>
              Who We Are
            </p>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1.2, margin: '0 0 18px' }}>
              About Sanvika Crackers
            </h1>
            <p style={{ color: '#a0aec0', fontSize: '1.1rem', fontWeight: 500, margin: 0, lineHeight: 1.7 }}>
              Premium Quality Fireworks Direct from Sivakasi
            </p>
          </div>
          {/* Right image */}
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <img
              src={aboutImg}
              alt="About Sanvika Crackers"
              style={{ width: '100%', borderRadius: 16, display: 'block', maxHeight: 340, objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>

      {/* ── Story + Stats Section ── */}
      <section style={{ background: '#FFFBF5', padding: '72px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'stretch' }}>
          {/* Left: story card */}
          <div style={{
            flex: '1 1 320px', minWidth: 0,
            background: '#1E1B4B',
            borderRadius: 16,
            padding: '36px 32px',
          }}>
            <h2 style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.5rem', margin: '0 0 6px' }}>Our Story</h2>
            <div style={{ width: 40, height: 3, background: '#F59E0B', borderRadius: 2, marginBottom: 20 }} />
            <p style={{ color: '#a0aec0', lineHeight: 1.8, margin: '0 0 16px', fontSize: '0.97rem' }}>
              Sanvika Crackers is a trusted factory outlet based in Sivakasi, Tamil Nadu — the fireworks capital of India.
              We manufacture and sell premium quality fireworks directly to customers at factory prices,
              cutting out middlemen so you always get the best value.
            </p>
            <p style={{ color: '#a0aec0', lineHeight: 1.8, margin: '0 0 16px', fontSize: '0.97rem' }}>
              With over 127 products across 21 categories — from sparklers and sound crackers to aerial sky shots and gift boxes —
              we have everything you need for Diwali, New Year, weddings, and all your celebrations.
            </p>
            <p style={{ color: '#a0aec0', lineHeight: 1.8, margin: 0, fontSize: '0.97rem' }}>
              We are committed to delivering genuine, safe, and high-quality fireworks with fast shipping during
              the festive season. Order online and get delivery right to your doorstep.
            </p>
          </div>

          {/* Right: 2×2 stats grid */}
          <div style={{ flex: '1 1 280px', minWidth: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignContent: 'start' }}>
            {[
              { num: '127+', label: 'Products' },
              { num: '21',   label: 'Categories' },
              { num: '100%', label: 'Factory Direct' },
              { num: '4',    label: 'Contact Numbers' },
            ].map(({ num, label }) => (
              <div key={label} style={{
                background: '#f9fafb',
                borderRadius: 14,
                padding: '28px 20px',
                textAlign: 'center',
                border: '1px solid #f0f0f0',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B', marginBottom: 6 }}>{num}</div>
                <div style={{ fontSize: '0.88rem', color: '#718096', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section style={{ background: '#FFFBF5', padding: '0 16px 72px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 900, color: '#1E1B4B', margin: '0 0 8px' }}>
              Why Choose Us
            </h2>
            <div style={{ width: 40, height: 3, background: '#4C1D95', margin: '8px auto 0', borderRadius: 2 }} />
          </div>

          {/* 3×2 grid of text cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { title: 'Factory Direct Prices',  desc: 'We are the manufacturer. No middlemen means you always pay the lowest possible price for the best quality.' },
              { title: 'Genuine & Safe Products', desc: 'All our fireworks are licensed, tested, and comply with government safety standards. 100% genuine products guaranteed.' },
              { title: 'Wide Range',              desc: '127+ products across 21 categories — crackers, sparklers, fountains, sky shots, gift boxes and more.' },
              { title: 'Fast Delivery',           desc: 'We ship within 24 hours during the festive season. Pan-India delivery with careful packaging.' },
              { title: 'Trusted Since Years',     desc: 'Sanvika Crackers has been serving customers across Tamil Nadu and all over India with trust and quality.' },
              { title: 'Easy Online Ordering',    desc: 'Browse, add to cart, and send your enquiry via WhatsApp in minutes. Simple, fast, and hassle-free.' },
            ].map(({ title, desc }) => (
              <div key={title} style={{
                background: '#1E1B4B',
                borderRadius: 12,
                padding: '28px 24px',
                borderTop: '3px solid #4C1D95',
              }}>
                <h3 style={{ color: '#ffffff', fontWeight: 800, fontSize: '1rem', margin: '0 0 12px' }}>{title}</h3>
                <p style={{ color: '#a0aec0', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Strip ── */}
      <section style={{ background: '#4C1D95', padding: '52px 16px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#ffffff', fontWeight: 900, fontSize: 'clamp(1.4rem, 3vw, 2rem)', margin: '0 0 16px' }}>
            Ready to Order?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1rem', margin: '0 0 28px', lineHeight: 1.7 }}>
            Get in touch with us for bulk orders, custom enquiries, or any questions about our products.
          </p>
          <Link
            to="/contact"
            style={{
              display: 'inline-block',
              background: '#F59E0B',
              color: '#24163D',
              padding: '14px 40px',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: '1rem',
              textDecoration: 'none',
              letterSpacing: '0.04em',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#D97706'}
            onMouseLeave={e => e.currentTarget.style.background = '#F59E0B'}
          >
            Contact Us
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
