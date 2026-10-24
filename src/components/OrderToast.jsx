import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

export default function OrderToast({ show, onClose, customerName, type = 'success', message }) {
  const [visible, setVisible] = useState(false)

  const isError = type === 'error'
  const duration = isError ? 4000 : 5000

  useEffect(() => {
    if (show) {
      setVisible(true)
      const t = setTimeout(() => {
        setVisible(false)
        setTimeout(onClose, 400)
      }, duration)
      return () => clearTimeout(t)
    }
  }, [show])

  const bg        = isError ? '#fff5f5' : '#f0fdf4'
  const border    = isError ? '#fca5a5' : '#86efac'
  const iconColor = isError ? '#ef4444' : '#22c55e'
  const titleColor= isError ? '#991b1b' : '#15803d'

  return (
    <div style={{
      position: 'fixed', top: 80, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : '-130px'})`,
      zIndex: 999999,
      transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      width: 360, maxWidth: 'calc(100vw - 32px)',
    }}>
      <div style={{
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: 14,
        boxShadow: '0 6px 32px rgba(0,0,0,0.13)',
        padding: '16px 16px 16px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        {/* Icon */}
        <div style={{ flexShrink: 0, paddingTop: 1 }}>
          {isError
            ? <AlertCircle size={24} color={iconColor} />
            : <CheckCircle2 size={24} color={iconColor} />
          }
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: titleColor, marginBottom: 4 }}>
            {isError ? 'Minimum Order Not Met' : 'Enquiry Sent! 🎉'}
          </div>
          <div style={{ fontSize: 13, color: '#444', lineHeight: 1.55 }}>
            {isError
              ? (message || 'Please meet the minimum order value to proceed.')
              : (customerName ? `Hi ${customerName}, your` : 'Your') + ' enquiry sent via WhatsApp. Our team will contact you shortly.'
            }
          </div>
        </div>

        {/* Close */}
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 400) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#999', flexShrink: 0, padding: 2, lineHeight: 1,
          }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
