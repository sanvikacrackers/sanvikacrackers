import { useShop } from '../context/ShopContext'
import LOGO from '../assets/new.png'

export default function TopBar() {
  const { siteSettings } = useShop()
  const announcement = siteSettings.announcement

  const marqueeContent = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16, whiteSpace: 'nowrap' }}>
      <img src={LOGO} alt="Sanvika Crackers" style={{ height: 28, width: 'auto', objectFit: 'contain', verticalAlign: 'middle', borderRadius: 3 }} />
      {announcement && (
        <span style={{ color: '#fcd34d', fontWeight: 600 }}>{announcement}</span>
      )}
      <span style={{ color: '#d1d5db' }}>
        Browse our products and send enquiry via WhatsApp.&nbsp;
        <strong style={{ color: '#f9fafb' }}>Not a direct sale portal.</strong>
      </span>
      <span style={{ color: '#4b5563', margin: '0 20px' }}>·</span>
    </span>
  )

  return (
    <div style={{ background: '#1E1B4B', color: '#d1d5db', fontSize: 12, padding: '7px 0', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <div style={{ display: 'inline-flex', animation: 'marquee-scroll 30s linear infinite' }}>
          {marqueeContent}{marqueeContent}{marqueeContent}
        </div>
      </div>
    </div>
  )
}
