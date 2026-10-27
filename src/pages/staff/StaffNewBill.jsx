import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Search, Plus, Minus, Trash2, CheckCircle,
  X, Camera, Package, AlertCircle, Printer, User, Phone,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { calcBillTotals, calcLineTotal, fmtINR, formatIST } from '../../utils/billingUtils';

const DRAFT_KEY = (uid) => `sanvika_staff_draft_${uid}`;

// ── Camera Scanner ─────────────────────────────────────
function CameraScanner({ onBarcode, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const lastScanRef = useRef({ barcode: null, time: 0 });
  const [error, setError] = useState('');
  const [lastScan, setLastScan] = useState('');
  const [flash, setFlash] = useState(false);

  const handleScan = useCallback((text) => {
    const now = Date.now();
    // Ignore same barcode within 500ms to prevent camera multi-frame duplicate reads
    if (lastScanRef.current.barcode === text && now - lastScanRef.current.time < 500) return;
    lastScanRef.current = { barcode: text, time: now };

    setLastScan(text);
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
    onBarcode(text);
  }, [onBarcode]);

  // Lock body scroll while scanner is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    let stopped = false;
    const start = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId = devices[devices.length - 1]?.deviceId;
        const controls = await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result) => {
          if (stopped) return;
          if (result) handleScan(result.getText());
        });
        readerRef.current = controls;
      } catch (e) {
        setError('Camera not available: ' + (e.message || 'Permission denied'));
      }
    };
    start();
    return () => {
      stopped = true;
      try { readerRef.current?.stop?.(); } catch {}
    };
  }, [handleScan]);

  return (
    <div className="sf-overlay">
      <div className="sf-modal" style={{ maxWidth: 520 }}>
        <div className="sf-modal-header">
          <span className="sf-modal-title">Camera Scanner</span>
          <button className="sf-close-btn" onClick={onClose}><X /></button>
        </div>
        <div className="sf-modal-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
          {error ? (
            <div className="sf-err-box">{error}</div>
          ) : (
            <div
              className="sf-camera-wrap"
              style={{
                border: flash ? '3px solid #22c55e' : '3px solid transparent',
                borderRadius: 12,
                transition: 'border-color 0.15s',
                boxShadow: flash ? '0 0 0 4px rgba(34,197,94,0.2)' : 'none',
              }}
            >
              <video ref={videoRef} className="sf-camera-video" muted playsInline />
            </div>
          )}

          {/* Last scanned indicator */}
          {lastScan ? (
            <div style={{
              marginTop: 10, padding: '8px 14px',
              background: flash ? '#dcfce7' : '#f1f5f9',
              border: `1px solid ${flash ? '#86efac' : '#e2e8f0'}`,
              borderRadius: 8, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', flexShrink: 0 }}>LAST SCAN</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: flash ? '#15803d' : '#1e293b', fontFamily: 'monospace' }}>{lastScan}</span>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 10, textAlign: 'center' }}>
              Point camera at a barcode — it scans automatically
            </p>
          )}
        </div>
        <div className="sf-modal-footer" style={{ justifyContent: 'center' }}>
          <button className="sf-btn sf-btn-danger" onClick={onClose}>
            <X style={{ width: 14, height: 14 }} /> Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Search ─────────────────────────────────────
function ProductSearch({ products, billItems, onAdd, onDecrement, onSetQty }) {
  const [query, setQuery] = useState('');

  const filtered = products
    .filter((p) => {
      if (!p.is_active) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q)
        || p.product_code?.toLowerCase().includes(q)
        || p.barcode?.toLowerCase().includes(q)
        || p.category?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      // Products already in the bill float to the top
      const aInBill = billItems?.some((i) => i.product_id === a.id) ? 1 : 0;
      const bInBill = billItems?.some((i) => i.product_id === b.id) ? 1 : 0;
      return bInBill - aInBill;
    });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div className="sf-input-wrap" style={{ flex: 1 }}>
          <Search className="sf-input-icon" />
          <input
            className="sf-input with-icon"
            placeholder="Search by name, code, or barcode…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {query && (
          <button className="sf-btn sf-btn-ghost sf-btn-sm" onClick={() => setQuery('')}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {filtered.length === 0 && query && (
        <div className="sf-empty" style={{ padding: '20px 0' }}>
          <AlertCircle />
          <div className="sf-empty-title">No products found</div>
          <div className="sf-empty-desc">Try a different search term</div>
        </div>
      )}

      <div className="product-search-grid">
        {filtered.map((p) => {
          const billItem = billItems?.find((i) => i.product_id === p.id);
          const qty = billItem?.quantity || 0;
          return (
            <div
              key={p.id}
              className={`product-search-card${qty > 0 ? ' in-bill' : ''}`}
              onClick={qty === 0 ? () => onAdd(p) : undefined}
              style={{ cursor: qty === 0 ? 'pointer' : 'default' }}
            >
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="product-search-img" loading="lazy" />
              ) : (
                <div className="product-search-img-placeholder">
                  <Package style={{ width: 28, height: 28 }} />
                </div>
              )}
              <div className="product-search-body">
                <div className="product-search-name">{p.name}</div>
                <div className="product-search-code">#{p.product_code}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <div className="product-search-price">{fmtINR(p.price)}</div>
                  {qty > 0 ? (
                    <div className="psc-qty-ctrl" onClick={(e) => e.stopPropagation()}>
                      <button className="psc-qty-btn" onClick={() => onDecrement(billItem._key)}>
                        <Minus style={{ width: 10, height: 10 }} />
                      </button>
                      <input
                        className="psc-qty-input"
                        type="text"
                        inputMode="numeric"
                        value={qty}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g,''); onSetQty(billItem._key, v || '0'); }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button className="psc-qty-btn" onClick={() => onAdd(p)}>
                        <Plus style={{ width: 10, height: 10 }} />
                      </button>
                    </div>
                  ) : (
                    <button className="psc-add-btn" onClick={(e) => { e.stopPropagation(); onAdd(p); }}>
                      <Plus style={{ width: 12, height: 12 }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Finalize Dialog ────────────────────────────────────
function FinalizeDialog({ items, totals, customerName, setCustomerName, customerPhone, setCustomerPhone, onConfirm, onClose, loading }) {
  const [discType, setDiscType] = useState('flat');
  const [discVal, setDiscVal] = useState('');

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const extraDiscount = (() => {
    const v = parseFloat(discVal) || 0;
    if (discType === 'percent') return Math.min(Math.round(totals.grand_total * v) / 100, totals.grand_total);
    return Math.min(v, totals.grand_total);
  })();

  const adjustedTotals = {
    subtotal: totals.subtotal,
    discount_total: Math.round((totals.discount_total + extraDiscount) * 100) / 100,
    grand_total: Math.max(0, Math.round((totals.grand_total - extraDiscount) * 100) / 100),
  };

  return (
    <div className="sf-overlay">
      <div className="sf-modal">
        <div className="sf-modal-header">
          <span className="sf-modal-title">Finalize Bill</span>
          <button className="sf-close-btn" onClick={onClose}><X /></button>
        </div>
        <div className="sf-modal-body">
          {/* Customer */}
          <div className="finalize-customer-row" style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div className="sf-input-wrap" style={{ flex: 1 }}>
              <User className="sf-input-icon" style={{ width: 14, height: 14 }} />
              <input
                className="sf-input with-icon"
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ fontSize: 13 }}
              />
            </div>
            <div className="sf-input-wrap" style={{ flex: 1 }}>
              <Phone className="sf-input-icon" style={{ width: 14, height: 14 }} />
              <input
                className="sf-input with-icon"
                placeholder="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{ fontSize: 13 }}
                maxLength={15}
              />
            </div>
          </div>

          {/* Extra discount */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Additional Discount</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                <button
                  style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: discType === 'flat' ? '#7F1D1D' : '#f1f5f9', color: discType === 'flat' ? '#fff' : '#64748b' }}
                  onClick={() => setDiscType('flat')}
                >₹</button>
                <button
                  style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: discType === 'percent' ? '#7F1D1D' : '#f1f5f9', color: discType === 'percent' ? '#fff' : '#64748b' }}
                  onClick={() => setDiscType('percent')}
                >%</button>
              </div>
              <input
                className="sf-input"
                type="number"
                min="0"
                max={discType === 'percent' ? 100 : totals.grand_total}
                placeholder={discType === 'flat' ? 'Amount in ₹' : 'Percentage'}
                value={discVal}
                onChange={(e) => setDiscVal(e.target.value)}
                style={{ flex: 1, fontSize: 13 }}
              />
            </div>
          </div>

          {/* Totals */}
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16 }}>
            <div className="bill-total-row">
              <span>Items</span><span>{items.length} product(s)</span>
            </div>
            <div className="bill-total-row">
              <span>Subtotal</span><span>{fmtINR(adjustedTotals.subtotal)}</span>
            </div>
            <div className="bill-total-row" style={{ color: extraDiscount > 0 ? '#16a34a' : undefined }}>
              <span>Discount</span><span>−{fmtINR(adjustedTotals.discount_total)}</span>
            </div>
            <div className="bill-total-row grand" style={{ padding: 0, border: 'none', borderTop: '1px dashed #cbd5e1', paddingTop: 10, marginTop: 8 }}>
              <span>Grand Total</span>
              <span style={{ color: '#15803d' }}>{fmtINR(adjustedTotals.grand_total)}</span>
            </div>
          </div>
        </div>
        <div className="sf-modal-footer">
          <button className="sf-btn sf-btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="sf-btn sf-btn-success" onClick={() => onConfirm(adjustedTotals)} disabled={loading}>
            <CheckCircle style={{ width: 15, height: 15 }} />
            {loading ? 'Finalizing…' : `Confirm & Finalize — ${fmtINR(adjustedTotals.grand_total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bill Print ─────────────────────────────────────────
function printBill(order, items) {
  const { fmtINR: fmt, formatIST: fdt } = { fmtINR, formatIST };
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Bill ${order.bill_number}</title>
<style>
  body{font-family:'Courier New',monospace;background:#fff;color:#000;padding:10mm;max-width:148mm;margin:0 auto;}
  h1{text-align:center;font-size:18px;margin:0;}
  .sub{text-align:center;font-size:11px;color:#555;margin-bottom:8px;}
  .meta{display:flex;justify-content:space-between;font-size:11px;border-bottom:1px solid #000;padding-bottom:6px;margin-bottom:6px;}
  .cust{font-size:11px;color:#333;margin-bottom:6px;border-bottom:1px dashed #ccc;padding-bottom:6px;}
  table{width:100%;border-collapse:collapse;font-size:11px;}
  th{border-bottom:1px solid #000;padding:3px 2px;text-align:left;}
  td{padding:3px 2px;border-bottom:1px dashed #ccc;}
  .totals{border-top:2px solid #000;margin-top:6px;padding-top:6px;font-size:12px;}
  .row{display:flex;justify-content:space-between;margin-bottom:3px;}
  .grand{font-weight:900;font-size:14px;border-top:1px solid #000;padding-top:4px;margin-top:4px;}
  .footer{text-align:center;font-size:10px;color:#555;border-top:1px dashed #ccc;padding-top:8px;margin-top:12px;}
  @media print{body{padding:0;}}
</style></head><body>
<h1>Sanvika Crackers</h1>
<div class="sub">Quality Fireworks Since 2020 · +91 83000 57711</div>
<div class="meta">
  <span>Bill: <b>${order.bill_number}</b></span>
  <span>${fdt(order.finalized_at || order.created_at)}</span>
</div>
${order.customer_name || order.customer_phone ? `<div class="cust">Customer: <b>${order.customer_name || '—'}</b>${order.customer_phone ? ' · ' + order.customer_phone : ''}</div>` : ''}
<table>
  <tr><th>Product</th><th>Code</th><th>Qty</th><th>Price</th><th>Total</th></tr>
  ${items.map((i) => `<tr>
    <td>${i.product_name}</td>
    <td>${i.product_code}</td>
    <td>${i.quantity}</td>
    <td>${fmt(i.unit_price)}</td>
    <td>${fmt(i.line_total)}</td>
  </tr>`).join('')}
</table>
<div class="totals">
  <div class="row"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>
  <div class="row"><span>Discount</span><span>−${fmt(order.discount_total)}</span></div>
  <div class="row grand"><span>GRAND TOTAL</span><span>${fmt(order.grand_total)}</span></div>
</div>
<div class="footer">Thank you for shopping at Sanvika Crackers!<br/>Safe celebrations!</div>
</body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

// ── Main Component ─────────────────────────────────────
export default function StaffNewBill() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [lastBill, setLastBill] = useState(null);

  // Load products once
  useEffect(() => {
    supabase
      .from('products')
      .select('id, product_code, name, category, price, mrp, discount_percentage, barcode, image_url, is_active')
      .eq('is_active', true)
      .order('product_code')
      .then(({ data }) => setProducts(data || []));
  }, []);

  // Restore draft from localStorage
  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY(user.id));
      if (saved) setBillItems(JSON.parse(saved));
    } catch {}
  }, [user]);

  // Persist draft on change
  useEffect(() => {
    if (!user) return;
    try {
      if (billItems.length > 0) {
        localStorage.setItem(DRAFT_KEY(user.id), JSON.stringify(billItems));
      } else {
        localStorage.removeItem(DRAFT_KEY(user.id));
      }
    } catch {}
  }, [billItems, user]);

  const totals = calcBillTotals(billItems);

  // ── Add product to bill — new items & re-scanned items go to TOP ──
  const addProduct = useCallback((product) => {
    if (!product.is_active) {
      toast.error(`${product.name} is not available`);
      return;
    }
    setBillItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        const qty = existing.quantity + 1;
        // Move updated item to top
        const rest = prev.filter((i) => i.product_id !== product.id);
        return [
          { ...existing, quantity: qty, line_total: calcLineTotal(qty, existing.unit_price, existing.discount_amount) },
          ...rest,
        ];
      }
      const unit_price = Number(product.price) || 0;
      const discount_amount = 0;
      // Prepend new item at top
      return [
        {
          _key: crypto.randomUUID(),
          product_id: product.id,
          product_name: product.name,
          product_code: product.product_code,
          barcode: product.barcode || '',
          unit_price,
          quantity: 1,
          discount_amount,
          line_total: calcLineTotal(1, unit_price, discount_amount),
        },
        ...prev,
      ];
    });
    toast.success(`${product.name} added`, { duration: 1200, position: 'bottom-center' });
  }, []);

  // ── Barcode lookup — scanner stays open ──────────────
  const handleBarcode = useCallback(async (barcode) => {
    const local = products.find(
      (p) => p.barcode === barcode || p.product_code === barcode
    );
    if (local) {
      addProduct(local);
      return;
    }
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`barcode.eq.${barcode},product_code.eq.${barcode}`)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error || !data) {
      toast.error(`Barcode "${barcode}" not found`, { duration: 3000 });
      return;
    }
    addProduct(data);
  }, [products, addProduct]);

  // ── Update quantity ──────────────────────────────────
  const updateQty = (key, delta) => {
    setBillItems((prev) =>
      prev
        .map((i) => {
          if (i._key !== key) return i;
          const qty = Math.max(0, i.quantity + delta);
          if (qty === 0) return null;
          return { ...i, quantity: qty, line_total: calcLineTotal(qty, i.unit_price, i.discount_amount) };
        })
        .filter(Boolean)
    );
  };

  const setItemQty = (key, qty) => {
    const n = parseInt(qty, 10);
    if (isNaN(n) || n < 0) return;
    if (n > 999) { toast.error('Maximum quantity is 999', { id: 'qty-max', duration: 2000 }); }
    const clamped = Math.min(n, 999);
    setBillItems((prev) =>
      clamped === 0
        ? prev.filter((i) => i._key !== key)
        : prev.map((i) => i._key !== key ? i : { ...i, quantity: clamped, line_total: calcLineTotal(clamped, i.unit_price, i.discount_amount) })
    );
  };

  const removeItem = (key) => setBillItems((prev) => prev.filter((i) => i._key !== key));

  // ── Finalize bill ────────────────────────────────────
  const handleFinalize = async (adjustedTotals) => {
    if (billItems.length === 0) return;
    setFinalizing(true);
    try {
      const { data: order, error: orderErr } = await supabase
        .from('billing_orders')
        .insert({
          staff_id: user.id,
          status: 'draft',
          subtotal: adjustedTotals.subtotal,
          discount_total: adjustedTotals.discount_total,
          grand_total: adjustedTotals.grand_total,
          customer_name: customerName.trim() || null,
          customer_phone: customerPhone.trim() || null,
        })
        .select()
        .single();

      if (orderErr) throw new Error(orderErr.message);

      const itemRows = billItems.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        product_name: i.product_name,
        product_code: i.product_code,
        barcode: i.barcode,
        unit_price: i.unit_price,
        quantity: i.quantity,
        discount_amount: i.discount_amount,
        line_total: i.line_total,
      }));

      const { error: itemsErr } = await supabase
        .from('billing_order_items')
        .insert(itemRows);

      if (itemsErr) throw new Error(itemsErr.message);

      const { data: finalOrder, error: finalErr } = await supabase
        .rpc('finalize_billing_order', {
          p_order_id: order.id,
          p_subtotal: adjustedTotals.subtotal,
          p_discount_total: adjustedTotals.discount_total,
          p_grand_total: adjustedTotals.grand_total,
        })
        .single();

      if (finalErr) throw new Error(finalErr.message);

      setLastBill({ order: finalOrder, items: billItems });
      setBillItems([]);
      setCustomerName('');
      setCustomerPhone('');
      localStorage.removeItem(DRAFT_KEY(user.id));
      setShowFinalize(false);
      toast.success(`Bill ${finalOrder.bill_number} finalized!`, { duration: 4000 });
    } catch (err) {
      toast.error('Failed to finalize bill: ' + err.message);
    } finally {
      setFinalizing(false);
    }
  };

  const handleClearBill = () => {
    if (billItems.length === 0) return;
    if (!window.confirm('Clear the current bill? All items will be removed.')) return;
    setBillItems([]);
    toast.success('Bill cleared');
  };

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>New Bill</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="sf-btn sf-btn-secondary sf-btn-sm" onClick={() => setCameraOpen(true)}>
            <Camera style={{ width: 14, height: 14 }} />
            Camera Scan
          </button>
          <button
            className={`sf-btn sf-btn-sm${billItems.length > 0 ? ' sf-btn-success' : ' sf-btn-secondary'}`}
            onClick={() => billItems.length > 0 && setShowFinalize(true)}
            disabled={billItems.length === 0}
            title={billItems.length > 0 ? 'Finalize & save bill' : 'Add products to bill first'}
          >
            <Printer style={{ width: 14, height: 14 }} />
            Save Bill
          </button>
        </div>
      </div>

      {lastBill && (
        <div style={{
          background: '#dcfce7', border: '1px solid #86efac',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 13,
        }}>
          <div>
            <strong style={{ color: '#15803d' }}>✓ Bill {lastBill.order.bill_number} finalized!</strong>
            {' '}<span style={{ color: '#166534' }}>Total: {fmtINR(lastBill.order.grand_total)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="sf-btn sf-btn-success sf-btn-sm"
              onClick={() => printBill(lastBill.order, lastBill.items)}
            >
              <Printer style={{ width: 13, height: 13 }} />Print Bill
            </button>
            <button className="sf-btn sf-btn-ghost sf-btn-sm" onClick={() => setLastBill(null)}>
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>
      )}

      <div className="bill-page">
        {/* Cart — first in DOM so it appears on top on mobile */}
        <div className="bill-cart bill-cart-col">
          <div className="bill-cart-header">
            <span>Current Bill</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {billItems.length} item{billItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="bill-cart-items">
            {billItems.length === 0 ? (
              <div className="sf-empty" style={{ padding: '30px 16px' }}>
                <Package />
                <div className="sf-empty-desc">Scan a barcode or search products to start billing</div>
              </div>
            ) : (
              billItems.map((item) => (
                <div key={item._key} className="bill-cart-item">
                  <div>
                    <div className="bill-cart-item-name">{item.product_name}</div>
                    <div className="bill-cart-item-code">#{item.product_code}</div>
                    <div className="bill-qty-ctrl">
                      <button className="bill-qty-btn" onClick={() => updateQty(item._key, -1)}>
                        <Minus style={{ width: 10, height: 10 }} />
                      </button>
                      <input
                        className="bill-qty-val"
                        type="text"
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g,''); setItemQty(item._key, v || '0'); }}
                        style={{ width: 36, textAlign: 'center', border: 'none', background: 'transparent', fontWeight: 700, fontSize: 13 }}
                      />
                      <button className="bill-qty-btn" onClick={() => updateQty(item._key, 1)}>
                        <Plus style={{ width: 10, height: 10 }} />
                      </button>
                    </div>
                  </div>
                  <div className="bill-cart-item-right">
                    <div className="bill-cart-item-total">{fmtINR(item.line_total)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtINR(item.unit_price)} ea.</div>
                    <button className="bill-cart-item-remove" onClick={() => removeItem(item._key)} title="Remove">
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {billItems.length > 0 && (
            <>
              <div className="bill-cart-totals">
                <div className="bill-total-row">
                  <span>Subtotal</span>
                  <span>{fmtINR(totals.subtotal)}</span>
                </div>
                {totals.discount_total > 0 && (
                  <div className="bill-total-row" style={{ color: '#16a34a' }}>
                    <span>Discount</span>
                    <span>−{fmtINR(totals.discount_total)}</span>
                  </div>
                )}
                <div className="bill-total-row grand">
                  <span>Grand Total</span>
                  <span className="bill-grand-amt">{fmtINR(totals.grand_total)}</span>
                </div>
              </div>

              <div className="bill-cart-actions">
                <button
                  className="sf-btn sf-btn-success sf-btn-block"
                  onClick={() => setShowFinalize(true)}
                >
                  <CheckCircle style={{ width: 16, height: 16 }} />
                  Finalize Bill — {fmtINR(totals.grand_total)}
                </button>
                <button
                  className="sf-btn sf-btn-secondary sf-btn-block sf-btn-sm"
                  onClick={handleClearBill}
                >
                  <Trash2 style={{ width: 13, height: 13 }} />
                  Clear Bill
                </button>
              </div>
            </>
          )}
        </div>

        {/* Product search — second in DOM, pushed to left on desktop via CSS order */}
        <div className="bill-search-col">
          <div className="sf-card">
            <div className="sf-card-header">
              <span className="sf-card-title">Search Products</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{products.length} products</span>
            </div>
            <div className="sf-card-body">
              <ProductSearch products={products} billItems={billItems} onAdd={addProduct} onDecrement={(key) => updateQty(key, -1)} onSetQty={setItemQty} />
            </div>
          </div>
        </div>
      </div>

      {/* Camera Scanner — stays open until manually closed */}
      {cameraOpen && (
        <CameraScanner
          onBarcode={handleBarcode}
          onClose={() => setCameraOpen(false)}
        />
      )}

      {/* Finalize Confirmation */}
      {showFinalize && (
        <FinalizeDialog
          items={billItems}
          totals={totals}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          onConfirm={handleFinalize}
          onClose={() => setShowFinalize(false)}
          loading={finalizing}
        />
      )}
    </div>
  );
}
