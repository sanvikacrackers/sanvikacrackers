import { Link } from 'react-router-dom'
import { Phone, MapPin, Mail } from 'lucide-react'
import LOGO from '../assets/websitelogo.jpeg'
import paymentImg from '../assets/payment.jpeg'
import gpayImg from '../assets/gpay.jpeg'


export default function Footer() {
  return (
    <footer id="contact" className="bg-[#4d0004] text-gray-400 pt-12 pb-6">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Brand */}
            <div>
              <img src={LOGO} alt="Sanvika Crackers" className="h-10 w-auto object-contain mb-4" />
              <ul className="space-y-2 text-[13px] list-none p-0">
                <li className="flex gap-2">
                  <Phone size={14} className="mt-0.5 flex-shrink-0 text-[#FDE68A]" />
                  <span>83000 57711</span>
                </li>
                <li className="flex gap-2">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0 text-[#FDE68A]" />
                  <span>1/204-6, NH-07, Chatram Road, Vachakkarapatti, RR Nagar, Virudhunagar District - 626204</span>
                </li>
                <li className="flex gap-2">
                  <Mail size={14} className="mt-0.5 flex-shrink-0 text-[#FDE68A]" />
                  <span>sanvikacrackers2020@gmail.com</span>
                </li>
              </ul>
            </div>

            {/* Payment image */}
            <div className="flex flex-col justify-center items-center">
              <h3 className="text-base font-bold text-white mb-4 pb-2 border-b-2 border-[#F59E0B] inline-block">Accepted Payments</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <img src={paymentImg} alt="Payment Options" style={{ maxWidth: 280, width: '100%', objectFit: 'contain', borderRadius: 8 }} />
                <img src={gpayImg} alt="GPay" style={{ maxWidth: 300, width: '100%', objectFit: 'contain', borderRadius: 8 }} />
              </div>
            </div>

          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="border-t border-[#6b0205] mt-10 pt-6">
          <div className="max-w-[1400px] mx-auto px-4">
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 20px' }}>
              <p className="text-[12px] leading-relaxed text-center" style={{ color: '#e2e8f0', margin: 0 }}>

                As per 2018 Supreme Court order, online sale of firecrackers are not permitted! We value our customers and at the same time, respect jurisdiction. We request you to add your products to the cart and submit the required crackers through the enquiry button. We will contact you within 24 hrs and confirm the order through WhatsApp or phone call. Please add and submit your enquiries and enjoy your Diwali with Sanvika Crackers. Our License No. ——. Sanvika Crackers as a company following 100% legal &amp; statutory compliances and all our shops, go-downs are maintained as per the explosive acts. We send the parcels through registered and legal transport service providers as like every other major companies in Sivakasi is doing so.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#6b0205] mt-5 pt-5" style={{ background: '#2a0002' }}>
          <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-gray-500">© 2026, Sanvika Crackers. All Rights Reserved.</p>
          </div>
        </div>
    </footer>
  )
}
