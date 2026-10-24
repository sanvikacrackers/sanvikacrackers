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
    title: 'About Us – Sri Veera Fireworks | Sivakasi Crackers Manufacturer',
    description: 'Learn about Sri Veera Fireworks, a trusted crackers brand from Sivakasi, Tamil Nadu. Quality fireworks, 100% legal & licensed, safe packaging and delivery.',
    url: '/about',
  })

  const { } = useShop()

  return (
    <div className="theme-color4 light ltr" style={{ minHeight: '100vh', background: 'rgb(255,251,235)' }}>

      <TopBar />

      <Header />


      {/* Hero Image */}
      <div style={{ width: '100%', lineHeight: 0 }}>
        <img
          src={aboutImg}
          alt="About Sri Veera Fireworks"
          style={{ width: '100%', display: 'block' }}
        />
      </div>

      {/* About Content */}
      <section className="py-14 bg-white">
        <div className="max-w-[1100px] mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="subtitle-two">Our Story</p>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-5">Fireworks Direct From Factory</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Sri Veera Fireworks is a trusted factory outlet based in Sivakasi, Tamil Nadu — the fireworks capital of India.
                We manufacture and sell premium quality fireworks directly to customers at factory prices, cutting out middlemen so you always get the best value.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                With over 127 products across 21 categories — from sparklers and sound crackers to aerial sky shots and gift boxes —
                we have everything you need for Diwali, New Year, weddings, and all your celebrations.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We are committed to delivering genuine, safe, and high-quality fireworks with fast shipping during the festive season. Order online and get delivery right to your doorstep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-orange-50">
        <div className="max-w-[1100px] mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { num: '127+', label: 'Products' },
              { num: '21',   label: 'Categories' },
              { num: '100%', label: 'Factory Direct' },
              { num: '4',    label: 'Contact Numbers' },
            ].map(({ num, label }) => (
              <div key={label} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="text-3xl font-extrabold text-[#e87316] mb-1">{num}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-14 bg-white">
        <div className="max-w-[1100px] mx-auto px-4">
          <div className="text-center mb-10">
            <p className="subtitle-two">Why Choose Us</p>
            <h2 className="text-3xl font-extrabold text-gray-900">The Sri Veera Difference</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Factory Direct Prices',  desc: 'We are the manufacturer. No middlemen means you always pay the lowest possible price for the best quality.' },
              { title: 'Genuine & Safe Products', desc: 'All our fireworks are licensed, tested, and comply with government safety standards. 100% genuine products guaranteed.' },
              { title: 'Wide Range',              desc: '127+ products across 21 categories — crackers, sparklers, fountains, sky shots, gift boxes and more.' },
              { title: 'Fast Delivery',           desc: 'We ship within 24 hours during the festive season. Pan-India delivery with careful packaging.' },
              { title: 'Trusted Since Years',     desc: 'Sri Veera Fireworks has been serving customers across Tamil Nadu and all over India with trust and quality.' },
              { title: 'Easy Online Ordering',    desc: 'Browse, add to cart, and send your enquiry via WhatsApp in minutes. Simple, fast, and hassle-free.' },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-gray-50 rounded-2xl p-6">
                <div className="w-10 h-10 bg-[#e87316] rounded-xl mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12 bg-orange-50">
        <div className="max-w-[700px] mx-auto px-4 text-center">
          <p className="subtitle-two">Get In Touch</p>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Contact Us</h2>
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <Phone size={22} color="#e87316" className="flex-shrink-0" />
              <div className="text-left">
                <div className="font-bold text-gray-800 text-sm">Phone</div>
                <div className="text-gray-500 text-sm">83000 57711</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <MapPin size={22} color="#e87316" className="flex-shrink-0" />
              <div className="text-left">
                <div className="font-bold text-gray-800 text-sm">Address</div>
                <div className="text-gray-500 text-sm">1/204-6, NH-07, Chatram Road, Vachakkarapatti, RR Nagar, Virudhunagar District - 626204</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <Mail size={22} color="#e87316" className="flex-shrink-0" />
              <div className="text-left">
                <div className="font-bold text-gray-800 text-sm">Email</div>
                <div className="text-gray-500 text-sm">veerafireworks2020@gmail.com</div>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <Link to="/products" className="inline-block bg-[#e87316] text-white rounded-xl px-8 py-3 font-semibold hover:bg-[#cf6512] transition-colors no-underline">
              Shop Products →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
