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
          ? 'rgba(0,0,0,0.04)'
          : '#1a1a1a',
        color: disabled ? 'rgba(0,0,0,0.25)' : '#ffffff',
        border: disabled
          ? '1px solid rgba(0,0,0,0.08)'
          : '1px solid #2a2a2a',
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
        boxShadow: disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.35)',
        transition: 'background 0.18s, transform 0.12s, box-shadow 0.18s',
        userSelect: 'none',
        outline: 'none',
      }}
      onMouseEnter={e => {
        if (disabled) return
        e.currentTarget.style.background = '#333333'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.45)'
      }}
      onMouseLeave={e => {
        if (disabled) return
        e.currentTarget.style.background = '#1a1a1a'
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)'
      }}
      onMouseDown={e => {
        if (disabled) return
        e.currentTarget.style.transform = 'translateY(1px)'
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)'
      }}
      onMouseUp={e => {
        if (disabled) return
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.45)'
      }}
      onFocus={e => {
        if (disabled) return
        e.currentTarget.style.outline = '2px solid rgba(180,150,90,0.6)'
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
