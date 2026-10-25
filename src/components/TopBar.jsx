import { useShop } from '../context/ShopContext'
import LOGO from '../assets/new.png'

export default function TopBar() {
  const { siteSettings } = useShop()
  const announcement = siteSettings.announcement

  const marqueeContent = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16, whiteSpace: 'nowrap' }}>
      <img src={LOGO} alt="Sanvika Crackers" style={{ height: 28, width: 'auto', objectFit: 'contain', verticalAlign: 'middle', borderRadius: 3 }} />
      {announcement && (
        <span style={{ color: '#B4965A', fontWeight: 600 }}>{announcement}</span>
      )}
      <span style={{ color: '#ffffff' }}>
        Browse our products and send enquiry via WhatsApp.&nbsp;
        <strong style={{ color: '#ffffff' }}>Not a direct sale portal.</strong>
      </span>
      <span style={{ color: 'rgba(241,233,220,0.4)', margin: '0 20px' }}>·</span>
    </span>
  )

  return (
    <div style={{ background: '#603034', borderBottom: '1px solid rgba(180,150,90,0.25)', color: '#ffffff', fontSize: 12, padding: '7px 0', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <div style={{ display: 'inline-flex', animation: 'marquee-scroll 30s linear infinite' }}>
          {marqueeContent}{marqueeContent}{marqueeContent}
        </div>
      </div>
    </div>
  )
}
