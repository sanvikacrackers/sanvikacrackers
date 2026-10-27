import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Printer, Package, Pencil, X, Plus, Minus,
  Trash2, CheckCircle, Search, User, Phone, AlertCircle, Camera,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatIST, fmtINR, calcBillTotals, calcLineTotal } from '../../utils/billingUtils';

function printBill(order, items) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Bill ${order.bill_number}</title>
<style>
  body{font-family:'Courier New',monospace;background:#fff;color:#000;padding:10mm;max-width:148mm;margin:0 auto;}
  h1{text-align:center;font-size:18px;margin:0 0 4px;}
  .sub{text-align:center;font-size:11px;color:#555;margin-bottom:10px;}
  .meta{display:flex;justify-content:space-between;font-size:11px;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:8px;}
  .cust{font-size:11px;color:#333;margin-bottom:6px;border-bottom:1px dashed #ccc;padding-bottom:6px;}
  table{width:100%;border-collapse:collapse;font-size:11px;}
  th{border-bottom:1px solid #000;padding:4px 2px;text-align:left;}
  td{padding:4px 2px;border-bottom:1px dashed #ccc;}
  .totals{border-top:2px solid #000;margin-top:8px;padding-top:8px;}
  .row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;}
  .grand{font-weight:900;font-size:15px;border-top:1px solid #000;padding-top:4px;margin-top:4px;}
  .footer{text-align:center;font-size:10px;color:#555;border-top:1px dashed #ccc;padding-top:8px;margin-top:12px;}
</style></head><body>
<h1>Sanvika Crackers</h1>
<div class="sub">Quality Fireworks · +91 83000 57711 · sanvikacrackers.com</div>
<div class="meta">
  <div><div>Bill: <b>${order.bill_number}</b></div></div>
  <div style="text-align:right"><div>${formatIST(order.finalized_at || order.created_at)}</div></div>
</div>
${order.customer_name || order.customer_phone ? `<div class="cust">Customer: <b>${order.customer_name || '—'}</b>${order.customer_phone ? ' · ' + order.customer_phone : ''}</div>` : ''}
<table>
  <tr><th>#</th><th>Product</th><th>Code</th><th>Qty</th><th>Price</th><th>Total</th></tr>
  ${items.map((it, idx) => `<tr>
    <td>${idx + 1}</td>
    <td>${it.product_name}</td>
    <td>${it.product_code}</td>
    <td>${it.quantity}</td>
    <td>${fmtINR(it.unit_price)}</td>
    <td>${fmtINR(it.line_total)}</td>
  </tr>`).join('')}
</table>
<div class="totals">
  <div class="row"><span>Subtotal</span><span>${fmtINR(order.subtotal)}</span></div>
  ${Number(order.discount_total) > 0 ? `<div class="row"><span>Discount</span><span>-${fmtINR(order.discount_total)}</span></div>` : ''}
  <div class="row grand"><span>GRAND TOTAL</span><span>${fmtINR(order.grand_total)}</span></div>
</div>
<div class="footer">Thank you for shopping at Sanvika Crackers! Safe celebrations!</div>
</body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

// ── Product Search (edit mode) ──────────────────────────
// ── Camera Scanner ──────────────────────────────────────
function CameraScanner({ onBarcode, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let stopped = false;
    const start = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId = devices[devices.length - 1]?.deviceId;
        await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result) => {
          if (stopped) return;
          if (result) { onBarcode(result.getText()); }
        });
        readerRef.current = reader;
      } catch (e) {
        setError('Camera not available: ' + (e.message || 'Permission denied'));
      }
    };
    start();
    return () => { stopped = true; try { readerRef.current?.stop?.(); } catch {} };
  }, [onBarcode]);

  return (
    <div className="sf-overlay">
      <div className="sf-modal" style={{ maxWidth: 520 }}>
        <div className="sf-modal-header">
          <span className="sf-modal-title">Camera Scanner</span>
          <button className="sf-close-btn" onClick={onClose}><X /></button>
        </div>
        <div className="sf-modal-body">
          {error ? <div className="sf-err-box">{error}</div> : (
            <div className="sf-camera-wrap">
              <video ref={videoRef} className="sf-camera-video" muted playsInline />
            </div>
          )}
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 10, textAlign: 'center' }}>
            Point the camera at a barcode to scan it automatically
          </p>
        </div>
        <div className="sf-modal-footer">
          <button className="sf-btn sf-btn-secondary" onClick={onClose}>Close Scanner</button>
        </div>
      </div>
    </div>
  );
}

function Highlight({ text, query }) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#fef08a', color: '#713f12', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function ProductSearch({ products, billItems, onAdd, onDecrement, onSetQty }) {
  const [query, setQuery] = useState('');
  const q = query.trim();

  const filtered = products
    .filter((p) => {
      if (!p.is_active) return false;
      if (!q) return true;
      const ql = q.toLowerCase();
      return (
        p.name?.toLowerCase().includes(ql)
        || p.product_code?.toLowerCase().includes(ql)
        || p.barcode?.toLowerCase().includes(ql)
        || p.category?.toLowerCase().includes(ql)
      );
    })
    .sort((a, b) => {
      const aIn = billItems?.some((i) => i.product_id === a.id) ? 1 : 0;
      const bIn = billItems?.some((i) => i.product_id === b.id) ? 1 : 0;
      return bIn - aIn;
    });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div className="sf-input-wrap" style={{ flex: 1 }}>
          <Search className="sf-input-icon" />
          <input className="sf-input with-icon" placeholder="Search by name or code…"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {q && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '6px 10px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: '#92400e' }}>
            Showing <strong>{filtered.length}</strong> result{filtered.length !== 1 ? 's' : ''} for "<strong>{q}</strong>"
          </span>
          <button
            onClick={() => setQuery('')}
            style={{ fontSize: 12, fontWeight: 700, color: '#b45309', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 6 }}
          >
            <X style={{ width: 12, height: 12 }} /> Clear
          </button>
        </div>
      )}

      {filtered.length === 0 && q && (
        <div className="sf-empty" style={{ padding: '16px 0' }}>
          <AlertCircle /><div className="sf-empty-desc">No products found</div>
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
              {p.image_url
                ? <img src={p.image_url} alt={p.name} className="product-search-img" loading="lazy" />
                : <div className="product-search-img-placeholder"><Package style={{ width: 28, height: 28 }} /></div>}
              <div className="product-search-body">
                <div className="product-search-name"><Highlight text={p.name} query={q} /></div>
                <div className="product-search-code">#<Highlight text={p.product_code} query={q} /></div>
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

export default function StaffOrderDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit mode is driven entirely by the URL (?edit=true)
  const editMode = searchParams.get('edit') === 'true';
  const [editItems, setEditItems] = useState([]);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [discType, setDiscType] = useState('flat');
  const [discVal, setDiscVal] = useState('');
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from('billing_orders').select('*').eq('id', id).eq('staff_id', user.id).single(),
        supabase.from('billing_order_items').select('*').eq('order_id', id).order('created_at'),
      ]);
      if (orderRes.error || !orderRes.data) {
        setError('Order not found or you do not have permission to view it.');
      } else {
        setOrder(orderRes.data);
        setItems(itemsRes.data || []);
        if (searchParams.get('edit') === 'true' && orderRes.data.status !== 'cancelled') {
          // load products for edit mode
          supabase.from('products')
            .select('id, product_code, name, category, price, mrp, discount_percentage, barcode, image_url, is_active')
            .eq('is_active', true).order('product_code')
            .then(({ data }) => setProducts(data || []));
          setEditItems((itemsRes.data || []).map((i) => ({
            _key: i.id,
            product_id: i.product_id,
            product_name: i.product_name,
            product_code: i.product_code,
            barcode: i.barcode || '',
            unit_price: Number(i.unit_price),
            quantity: i.quantity,
            discount_amount: Number(i.discount_amount || 0),
            line_total: Number(i.line_total),
          })));
          setEditCustomerName(orderRes.data.customer_name || '');
          setEditCustomerPhone(orderRes.data.customer_phone || '');
        }
      }
      setLoading(false);
    };
    load();
  }, [id, user]);

  const enterEditMode = () => navigate(`/staff/orders/${id}?edit=true`);

  const addProduct = useCallback((product) => {
    setEditItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        const qty = existing.quantity + 1;
        const rest = prev.filter((i) => i.product_id !== product.id);
        return [{ ...existing, quantity: qty, line_total: calcLineTotal(qty, existing.unit_price, existing.discount_amount) }, ...rest];
      }
      const unit_price = Number(product.price) || 0;
      return [{
        _key: crypto.randomUUID(),
        product_id: product.id,
        product_name: product.name,
        product_code: product.product_code,
        barcode: product.barcode || '',
        unit_price,
        quantity: 1,
        discount_amount: 0,
        line_total: calcLineTotal(1, unit_price, 0),
      }, ...prev];
    });
    toast.success(`${product.name} added`, { duration: 1200, position: 'bottom-center' });
  }, []);

  const handleBarcode = useCallback(async (barcode) => {
    const local = products.find((p) => p.barcode === barcode || p.product_code === barcode);
    if (local) { addProduct(local); return; }
    const { data, error } = await supabase
      .from('products').select('*')
      .or(`barcode.eq.${barcode},product_code.eq.${barcode}`)
      .eq('is_active', true).limit(1).single();
    if (error || !data) { toast.error(`Barcode "${barcode}" not found`, { duration: 3000 }); return; }
    addProduct(data);
  }, [products, addProduct]);

  const updateQty = (key, delta) => {
    setEditItems((prev) =>
      prev.map((i) => {
        if (i._key !== key) return i;
        const qty = Math.max(0, i.quantity + delta);
        if (qty === 0) return null;
        return { ...i, quantity: qty, line_total: calcLineTotal(qty, i.unit_price, i.discount_amount) };
      }).filter(Boolean)
    );
  };

  const setItemQty = (key, qty) => {
    const n = parseInt(qty, 10);
    if (isNaN(n) || n < 0) return;
    if (n > 999) { toast.error('Maximum quantity is 999', { id: 'qty-max', duration: 2000 }); }
    const clamped = Math.min(n, 999);
    setEditItems((prev) =>
      clamped === 0
        ? prev.filter((i) => i._key !== key)
        : prev.map((i) => i._key !== key ? i : { ...i, quantity: clamped, line_total: calcLineTotal(clamped, i.unit_price, i.discount_amount) })
    );
  };

  const removeItem = (key) => setEditItems((prev) => prev.filter((i) => i._key !== key));

  const baseTotals = calcBillTotals(editItems);
  const extraDiscount = (() => {
    const v = parseFloat(discVal) || 0;
    if (discType === 'percent') return Math.min(Math.round(baseTotals.grand_total * v) / 100, baseTotals.grand_total);
    return Math.min(v, baseTotals.grand_total);
  })();
  const editTotals = {
    subtotal: baseTotals.subtotal,
    discount_total: Math.round((baseTotals.discount_total + extraDiscount) * 100) / 100,
    grand_total: Math.max(0, Math.round((baseTotals.grand_total - extraDiscount) * 100) / 100),
  };

  const handleSave = async () => {
    if (editItems.length === 0) { toast.error('Bill must have at least one item'); return; }
    setSaving(true);
    try {
      const { error: orderErr } = await supabase
        .from('billing_orders')
        .update({
          subtotal: editTotals.subtotal,
          discount_total: editTotals.discount_total,
          grand_total: editTotals.grand_total,
          customer_name: editCustomerName.trim() || null,
          customer_phone: editCustomerPhone.trim() || null,
        })
        .eq('id', order.id);
      if (orderErr) throw new Error(orderErr.message);

      const { error: delErr } = await supabase.from('billing_order_items').delete().eq('order_id', order.id);
      if (delErr) throw new Error(delErr.message);

      const { error: itemsErr } = await supabase.from('billing_order_items').insert(
        editItems.map((i) => ({
          order_id: order.id,
          product_id: i.product_id,
          product_name: i.product_name,
          product_code: i.product_code,
          barcode: i.barcode,
          unit_price: i.unit_price,
          quantity: i.quantity,
          discount_amount: i.discount_amount,
          line_total: i.line_total,
        }))
      );
      if (itemsErr) throw new Error(itemsErr.message);

      // refresh local state
      const { data: freshItems } = await supabase
        .from('billing_order_items').select('*').eq('order_id', order.id).order('created_at');
      setOrder((prev) => ({
        ...prev,
        ...editTotals,
        customer_name: editCustomerName.trim() || null,
        customer_phone: editCustomerPhone.trim() || null,
      }));
      setItems(freshItems || []);
      navigate(`/staff/orders/${id}`, { replace: true });
      toast.success('Bill updated successfully!');
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>;

  if (error) {
    return (
      <div>
        <Link to="/staff/orders" className="sf-btn sf-btn-ghost sf-btn-sm" style={{ marginBottom: 16 }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Orders
        </Link>
        <div className="sf-err-box">{error}</div>
      </div>
    );
  }

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  // ── Edit Mode ──────────────────────────────────────────
  if (editMode) {
    return (
      <>
      <div>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button className="sf-btn sf-btn-ghost sf-btn-sm" onClick={() => navigate(`/staff/orders/${id}`, { replace: true })}>
            <X style={{ width: 14, height: 14 }} /> Cancel
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Editing Bill</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{order.bill_number}</div>
          </div>
          <button className="sf-btn sf-btn-secondary sf-btn-sm" onClick={() => setCameraOpen(true)}>
            <Camera style={{ width: 14, height: 14 }} /> Camera Scan
          </button>
        </div>

        <div className="bill-page">
          {/* Cart — first in DOM so it appears on top on mobile */}
          <div className="bill-cart bill-cart-col">
            <div className="bill-cart-header">
              <span>Bill Items</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{editItems.length} item{editItems.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Customer */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
            <div className="finalize-customer-row" style={{ display: 'flex', gap: 8 }}>
              <div className="sf-input-wrap" style={{ flex: 1 }}>
                <User className="sf-input-icon" style={{ width: 14, height: 14 }} />
                <input className="sf-input with-icon" placeholder="Customer name" value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)} style={{ fontSize: 12, height: 34 }} />
              </div>
              <div className="sf-input-wrap" style={{ flex: 1 }}>
                <Phone className="sf-input-icon" style={{ width: 14, height: 14 }} />
                <input className="sf-input with-icon" placeholder="Phone" value={editCustomerPhone}
                  onChange={(e) => setEditCustomerPhone(e.target.value)} style={{ fontSize: 12, height: 34 }} maxLength={15} />
              </div>
            </div>
            </div>

            <div className="bill-cart-items">
              {editItems.length === 0 ? (
                <div className="sf-empty" style={{ padding: '30px 16px' }}>
                  <Package /><div className="sf-empty-desc">Search and add products</div>
                </div>
              ) : (
                editItems.map((item) => (
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
                      <button className="bill-cart-item-remove" onClick={() => removeItem(item._key)}>
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount + totals */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Additional Discount</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                  <button style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: discType === 'flat' ? '#7F1D1D' : '#f1f5f9', color: discType === 'flat' ? '#fff' : '#64748b' }}
                    onClick={() => setDiscType('flat')}>₹</button>
                  <button style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: discType === 'percent' ? '#7F1D1D' : '#f1f5f9', color: discType === 'percent' ? '#fff' : '#64748b' }}
                    onClick={() => setDiscType('percent')}>%</button>
                </div>
                <input className="sf-input" type="number" min="0" placeholder={discType === 'flat' ? 'Amount in ₹' : 'Percentage'}
                  value={discVal} onChange={(e) => setDiscVal(e.target.value)} style={{ flex: 1, fontSize: 12 }} />
              </div>

              <div className="bill-cart-totals" style={{ marginTop: 0 }}>
                <div className="bill-total-row"><span>Subtotal</span><span>{fmtINR(editTotals.subtotal)}</span></div>
                {editTotals.discount_total > 0 && (
                  <div className="bill-total-row" style={{ color: '#16a34a' }}>
                    <span>Discount</span><span>−{fmtINR(editTotals.discount_total)}</span>
                  </div>
                )}
                <div className="bill-total-row grand">
                  <span>Grand Total</span>
                  <span className="bill-grand-amt">{fmtINR(editTotals.grand_total)}</span>
                </div>
              </div>

              <div className="bill-cart-actions">
                <button className="sf-btn sf-btn-success sf-btn-block" onClick={handleSave} disabled={saving}>
                  <CheckCircle style={{ width: 16, height: 16 }} />
                  {saving ? 'Saving…' : `Save Changes — ${fmtINR(editTotals.grand_total)}`}
                </button>
              </div>
            </div>
          </div>

          {/* Product search — second in DOM, pushed left on desktop */}
          <div className="bill-search-col">
            <div className="sf-card">
              <div className="sf-card-header">
                <span className="sf-card-title">Add Products</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{products.length} products</span>
              </div>
              <div className="sf-card-body">
                <ProductSearch products={products} billItems={editItems} onAdd={addProduct} onDecrement={(key) => updateQty(key, -1)} onSetQty={setItemQty} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {cameraOpen && (
        <CameraScanner
          onBarcode={(b) => { handleBarcode(b); setCameraOpen(false); }}
          onClose={() => setCameraOpen(false)}
        />
      )}
      </>
    );
  }

  // ── View Mode ──────────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link to="/staff/orders" className="sf-btn sf-btn-ghost sf-btn-sm">
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bill Detail</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{order.bill_number}</div>
        </div>
        <span className={`sf-badge ${order.status}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
        {order.status !== 'cancelled' && (
          <button className="sf-btn sf-btn-secondary sf-btn-sm" onClick={enterEditMode}>
            <Pencil style={{ width: 13, height: 13 }} /> Edit
          </button>
        )}
        {order.status === 'finalized' && (
          <button className="sf-btn sf-btn-secondary sf-btn-sm" onClick={() => printBill(order, items)}>
            <Printer style={{ width: 13, height: 13 }} /> Print
          </button>
        )}
      </div>

      {/* Order Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="sf-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Created</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{formatIST(order.created_at)}</div>
        </div>
        {order.finalized_at && (
          <div className="sf-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Finalized</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{formatIST(order.finalized_at)}</div>
          </div>
        )}
        <div className="sf-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Items</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{items.length} products · {totalQty} units</div>
        </div>
        {(order.customer_name || order.customer_phone) && (
          <div className="sf-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Customer</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{order.customer_name || '—'}</div>
            {order.customer_phone && <div style={{ fontSize: 12, color: '#64748b' }}>{order.customer_phone}</div>}
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="sf-card" style={{ marginBottom: 20 }}>
        <div className="sf-card-header">
          <span className="sf-card-title">Bill Items</span>
        </div>
        {items.length === 0 ? (
          <div className="sf-empty"><Package /><div className="sf-empty-desc">No items found</div></div>
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table sf-table-card">
              <thead>
                <tr>
                  <th>#</th><th>Product</th><th>Code</th><th>Unit Price</th><th>Qty</th><th>Discount</th><th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td data-label="#" style={{ color: '#94a3b8' }}>{idx + 1}</td>
                    <td data-label="Product" style={{ fontWeight: 600 }}>{item.product_name}</td>
                    <td data-label="Code" style={{ color: '#64748b' }}>{item.product_code}</td>
                    <td data-label="Price">{fmtINR(item.unit_price)}</td>
                    <td data-label="Qty" style={{ fontWeight: 700 }}>{item.quantity}</td>
                    <td data-label="Discount" style={{ color: '#16a34a' }}>
                      {Number(item.discount_amount) > 0 ? `−${fmtINR(item.discount_amount * item.quantity)}` : '—'}
                    </td>
                    <td data-label="Total" style={{ fontWeight: 700 }}>{fmtINR(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="sf-card" style={{ maxWidth: 360, marginLeft: 'auto' }}>
        <div className="sf-card-body">
          <div className="bill-total-row"><span>Subtotal</span><span>{fmtINR(order.subtotal)}</span></div>
          {Number(order.discount_total) > 0 && (
            <div className="bill-total-row" style={{ color: '#16a34a' }}>
              <span>Discount</span><span>−{fmtINR(order.discount_total)}</span>
            </div>
          )}
          <div className="bill-total-row grand">
            <span>Grand Total</span>
            <span className="bill-grand-amt">{fmtINR(order.grand_total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
