import { ShoppingCart } from 'lucide-react'

export default function AddToCartButton({ onClick, label = 'Cart', disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        height: 44,
        padding: '0 18px',
        background: disabled
          ? 'rgba(255,255,255,0.06)'
          : 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
        color: disabled ? 'rgba(255,255,255,0.28)' : '#ffffff',
        border: disabled
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid #3a3a3a',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontSize: 15,
        fontWeight: 600,
        fontFamily: 'inherit',
        letterSpacing: '0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.45)',
        transition: 'background 0.18s, transform 0.12s, box-shadow 0.18s',
        userSelect: 'none',
        outline: 'none',
      }}
      onMouseEnter={e => {
        if (disabled) return
        e.currentTarget.style.background = 'linear-gradient(180deg, #363636 0%, #262626 100%)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.55)'
      }}
      onMouseLeave={e => {
        if (disabled) return
        e.currentTarget.style.background = 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)'
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.45)'
      }}
      onMouseDown={e => {
        if (disabled) return
        e.currentTarget.style.transform = 'translateY(1px)'
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.4)'
      }}
      onMouseUp={e => {
        if (disabled) return
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.55)'
      }}
      onFocus={e => {
        if (disabled) return
        e.currentTarget.style.outline = '2px solid rgba(245,158,11,0.6)'
        e.currentTarget.style.outlineOffset = '2px'
      }}
      onBlur={e => {
        e.currentTarget.style.outline = 'none'
      }}
    >
      {!disabled && <ShoppingCart size={17} strokeWidth={2} color="#ffffff" />}
      <span>{disabled ? 'Out of Stock' : label}</span>
    </button>
  )
}
