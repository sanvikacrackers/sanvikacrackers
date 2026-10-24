import { useShop } from '../context/ShopContext'
import LOGO from '../assets/new.png'

export default function TopBar() {
  const { siteSettings } = useShop()
  const announcement = siteSettings.announcement

  const marqueeContent = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap' }}>
      <img src={LOGO} alt="Sri Veera Fireworks" style={{ height: 34, width: 'auto', objectFit: 'contain', verticalAlign: 'middle', borderRadius: 3 }} />
      {announcement && (
        <span style={{ color: '#facc15', fontWeight: 700 }}>{announcement}</span>
      )}
      <span style={{ color: '#c4b5fd' }}>
        This site for displaying Products in Gallery and Generate Enquiry.&nbsp;
        <strong style={{ color: '#fff' }}>Not For Sale</strong>
      </span>
      <span style={{ color: '#7c3aed', margin: '0 24px' }}>•</span>
    </span>
  )

  return (
    <div style={{ background: '#2d1b69', color: '#e9d5ff', fontSize: 12, padding: '6px 0', overflow: 'hidden' }}>
      <div style={{ display: 'flex', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <div style={{ display: 'inline-flex', animation: 'marquee-scroll 30s linear infinite' }}>
          {marqueeContent}{marqueeContent}{marqueeContent}
        </div>
      </div>
    </div>
  )
}
