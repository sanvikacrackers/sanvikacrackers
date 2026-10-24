import { useCallback, useEffect, useState } from 'react';
import { Search, X, Printer, Eye, ClipboardList, Edit2, Trash2, Plus, Minus, Package, AlertCircle, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { formatIST, fmtINR, istDayStart, istDayEnd, calcBillTotals, calcLineTotal } from '../../utils/billingUtils';
import { CustomSelect } from '../Admin';
import '../../Staff.css';

const BILLING_START_YEAR = 2025;

function getYearOptions(maxYear) {
  const top = Math.max(maxYear, new Date().getFullYear());
  const opts = [];
  for (let y = top; y >= BILLING_START_YEAR; y--) {
    opts.push({ value: String(y), label: String(y) });
  }
  return opts;
}

function istYearRange(year) {
  const IST = 330 * 60 * 1000;
  const y = Number(year);
  const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0) - IST).toISOString();
  const end   = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999) - IST).toISOString();
  return { start, end };
}

const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'All time', value: 'all' },
];

function getDateRange(preset) {
  switch (preset) {
    case 'today': return { start: istDayStart(0), end: istDayEnd(0) };
    case 'yesterday': return { start: istDayStart(1), end: istDayEnd(1) };
    case '7d': return { start: istDayStart(6), end: istDayEnd(0) };
    case '30d': return { start: istDayStart(29), end: istDayEnd(0) };
    default: return null;
  }
}

function printBill(order, items) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Bill ${order.bill_number}</title>
<style>
  body{font-family:'Courier New',monospace;background:#fff;color:#000;padding:10mm;max-width:148mm;margin:0 auto;}
  h1{text-align:center;font-size:18px;margin:0 0 4px;}
  .sub{text-align:center;font-size:11px;color:#555;margin-bottom:10px;}
  .meta{display:flex;justify-content:space-between;font-size:11px;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:8px;}
  table{width:100%;border-collapse:collapse;font-size:11px;}
  th{border-bottom:1px solid #000;padding:4px 2px;text-align:left;}
  td{padding:4px 2px;border-bottom:1px dashed #ccc;}
  .totals{border-top:2px solid #000;margin-top:8px;padding-top:8px;}
  .row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;}
  .grand{font-weight:900;font-size:15px;border-top:1px solid #000;padding-top:4px;margin-top:4px;}
  .footer{text-align:center;font-size:10px;color:#555;border-top:1px dashed #ccc;padding-top:8px;margin-top:12px;}
</style></head><body>
<h1>Sanvika Crackers</h1>
<div class="sub">Quality Fireworks · +91 83000 57711</div>
<div class="meta">
  <div>Bill: <b>${order.bill_number}</b><br/>Staff: ${order.staff_name || '—'}</div>
  <div style="text-align:right">${formatIST(order.finalized_at || order.created_at)}</div>
</div>
<table>
  <tr><th>#</th><th>Product</th><th>Code</th><th>Qty</th><th>Price</th><th>Total</th></tr>
  ${items.map((it, idx) => `<tr>
    <td>${idx + 1}</td><td>${it.product_name}</td><td>${it.product_code}</td>
    <td>${it.quantity}</td><td>${fmtINR(it.unit_price)}</td><td>${fmtINR(it.line_total)}</td>
  </tr>`).join('')}
</table>
<div class="totals">
  <div class="row"><span>Subtotal</span><span>${fmtINR(order.subtotal)}</span></div>
  ${Number(order.discount_total) > 0 ? `<div class="row"><span>Discount</span><span>-${fmtINR(order.discount_total)}</span></div>` : ''}
  <div class="row grand"><span>GRAND TOTAL</span><span>${fmtINR(order.grand_total)}</span></div>
</div>
<div class="footer">Thank you for shopping at Sanvika Crackers!</div>
</body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

function OrderDetailModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const load = async () => {
      const [oRes, iRes] = await Promise.all([
        supabase.from('billing_orders').select('*, staff_users(name, email)').eq('id', orderId).single(),
        supabase.from('billing_order_items').select('*').eq('order_id', orderId).order('created_at'),
      ]);
      if (oRes.data) {
        setOrder({ ...oRes.data, staff_name: oRes.data.staff_users?.name });
      }
      setItems(iRes.data || []);
      setLoading(false);
    };
    load();
  }, [orderId]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Please provide a reason for cancellation.'); return; }
    if (!window.confirm(`Cancel bill ${order.bill_number}? This cannot be undone.`)) return;
    setCancelling(true);
    const { error } = await supabase.rpc('cancel_billing_order', {
      p_order_id: orderId,
      p_reason: cancelReason,
    });
    if (error) { toast.error(error.message); }
    else { toast.success(`Bill ${order.bill_number} cancelled.`); onClose(true); }
    setCancelling(false);
  };

  return (
    <div className="sf-overlay" style={{ zIndex: 9999 }}>
      <div className="sf-modal" style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="sf-modal-header">
          <span className="sf-modal-title">
            {loading ? 'Loading…' : order?.bill_number}
            {order && <span className={`sf-badge ${order.status}`} style={{ marginLeft: 8 }}>{order.status}</span>}
          </span>
          <button className="sf-close-btn" onClick={() => onClose(false)}><X /></button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>
        ) : order ? (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  ['Staff', order.staff_name],
                  ['Customer', order.customer_name || '—'],
                  ['Phone', order.customer_phone || '—'],
                  ['Created', formatIST(order.created_at)],
                  ['Finalized', order.finalized_at ? formatIST(order.finalized_at) : '—'],
                  ['Grand Total', fmtINR(order.grand_total)],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{val}</div>
                  </div>
                ))}
              </div>

              <div className="sf-table-wrap">
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Product</th><th>Code</th><th>Qty</th><th>Price</th><th>Discount</th><th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={it.id}>
                        <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{it.product_name}</td>
                        <td style={{ color: '#64748b' }}>{it.product_code}</td>
                        <td style={{ fontWeight: 700 }}>{it.quantity}</td>
                        <td>{fmtINR(it.unit_price)}</td>
                        <td style={{ color: '#16a34a' }}>{Number(it.discount_amount) > 0 ? `−${fmtINR(it.discount_amount * it.quantity)}` : '—'}</td>
                        <td style={{ fontWeight: 700 }}>{fmtINR(it.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 12, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <div style={{ fontSize: 13, color: '#64748b' }}>Subtotal: {fmtINR(order.subtotal)}</div>
                {Number(order.discount_total) > 0 && (
                  <div style={{ fontSize: 13, color: '#16a34a' }}>Discount: −{fmtINR(order.discount_total)}</div>
                )}
                <div style={{ fontSize: 16, fontWeight: 800, color: '#15803d' }}>Grand Total: {fmtINR(order.grand_total)}</div>
              </div>

              {order.status === 'cancelled' && order.cancelled_reason && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#fee2e2', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
                  <strong>Cancellation reason:</strong> {order.cancelled_reason}
                </div>
              )}

              {order.status === 'finalized' && (
                <div style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Cancel this bill (admin only)</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="sf-input"
                      placeholder="Reason for cancellation…"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button className="sf-btn sf-btn-danger sf-btn-sm" onClick={handleCancel} disabled={cancelling}>
                      {cancelling ? 'Cancelling…' : 'Cancel Bill'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="sf-modal-footer">
              <button className="sf-btn sf-btn-secondary" onClick={() => onClose(false)}>Close</button>
              {order.status === 'finalized' && (
                <button className="sf-btn sf-btn-primary" onClick={() => printBill(order, items)}>
                  <Printer style={{ width: 14, height: 14 }} /> Print Bill
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="sf-err-box" style={{ margin: 24 }}>Order not found</div>
        )}
      </div>
    </div>
  );
}

function EditOrderModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discType, setDiscType] = useState('flat');
  const [discVal, setDiscVal] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [oRes, iRes, pRes] = await Promise.all([
        supabase.from('billing_orders').select('*, staff_users(name)').eq('id', orderId).single(),
        supabase.from('billing_order_items').select('*').eq('order_id', orderId).order('created_at'),
        supabase.from('products').select('id,product_code,name,category,price,discount_percentage,barcode,image_url,is_active').eq('is_active', true).order('product_code'),
      ]);
      if (oRes.data) {
        setOrder({ ...oRes.data, staff_name: oRes.data.staff_users?.name });
        setCustomerName(oRes.data.customer_name || '');
        setCustomerPhone(oRes.data.customer_phone || '');
      }
      setEditItems((iRes.data || []).map((i) => ({
        _key: i.id,
        product_id: i.product_id,
        product_name: i.product_name,
        product_code: i.product_code,
        unit_price: Number(i.unit_price),
        quantity: i.quantity,
        discount_amount: Number(i.discount_amount || 0),
        line_total: Number(i.line_total),
      })));
      setProducts(pRes.data || []);
      setLoading(false);
    };
    load();
  }, [orderId]);

  const addProduct = useCallback((p) => {
    setEditItems((prev) => {
      const ex = prev.find((i) => i.product_id === p.id);
      if (ex) {
        const qty = ex.quantity + 1;
        return prev.map((i) => i.product_id === p.id
          ? { ...i, quantity: qty, line_total: calcLineTotal(qty, i.unit_price, i.discount_amount) } : i);
      }
      const unit_price = Number(p.price) || 0;
      const discount_amount = p.discount_percentage > 0
        ? Math.round(unit_price * p.discount_percentage) / 100 : 0;
      return [...prev, {
        _key: crypto.randomUUID(), product_id: p.id,
        product_name: p.name, product_code: p.product_code,
        unit_price, quantity: 1, discount_amount,
        line_total: calcLineTotal(1, unit_price, discount_amount),
      }];
    });
    toast.success(`${p.name} added`, { duration: 1000 });
  }, []);

  const setItemQty = (key, qty) => {
    const n = parseInt(qty, 10);
    if (isNaN(n) || n < 0) return;
    if (n > 999) toast.error('Maximum quantity is 999', { id: 'qty-max', duration: 2000 });
    const clamped = Math.min(n, 999);
    setEditItems((prev) => clamped === 0
      ? prev.filter((i) => i._key !== key)
      : prev.map((i) => i._key !== key ? i : { ...i, quantity: clamped, line_total: calcLineTotal(clamped, i.unit_price, i.discount_amount) }));
  };

  const baseTotals = calcBillTotals(editItems);
  const extraDiscount = (() => {
    const v = parseFloat(discVal) || 0;
    if (discType === 'percent') return Math.min(Math.round(baseTotals.grand_total * v) / 100, baseTotals.grand_total);
    return Math.min(v, baseTotals.grand_total);
  })();
  const totals = {
    subtotal: baseTotals.subtotal,
    discount_total: Math.round((baseTotals.discount_total + extraDiscount) * 100) / 100,
    grand_total: Math.max(0, Math.round((baseTotals.grand_total - extraDiscount) * 100) / 100),
  };

  const handleSave = async () => {
    if (editItems.length === 0) { toast.error('Bill must have at least one item'); return; }
    setSaving(true);
    try {
      const { error: oErr } = await supabase.from('billing_orders').update({
        subtotal: totals.subtotal, discount_total: totals.discount_total, grand_total: totals.grand_total,
        customer_name: customerName.trim() || null, customer_phone: customerPhone.trim() || null,
      }).eq('id', orderId);
      if (oErr) throw new Error(oErr.message);
      const { error: dErr } = await supabase.from('billing_order_items').delete().eq('order_id', orderId);
      if (dErr) throw new Error(dErr.message);
      const { error: iErr } = await supabase.from('billing_order_items').insert(
        editItems.map((i) => ({
          order_id: orderId, product_id: i.product_id, product_name: i.product_name,
          product_code: i.product_code, unit_price: i.unit_price, quantity: i.quantity,
          discount_amount: i.discount_amount, line_total: i.line_total,
        }))
      );
      if (iErr) throw new Error(iErr.message);
      toast.success('Bill updated');
      onClose(true);
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally { setSaving(false); }
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.product_code?.toLowerCase().includes(q);
  });

  return (
    <div className="sf-overlay" style={{ zIndex: 9999 }}>
      <div className="sf-modal" style={{ maxWidth: 800, maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="sf-modal-header">
          <span className="sf-modal-title">Edit Bill — {order?.bill_number || '…'}</span>
          <button className="sf-close-btn" onClick={() => onClose(false)}><X /></button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Customer info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="sf-form-lbl">Customer Name</label>
                <input className="sf-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
              </div>
              <div>
                <label className="sf-form-lbl">Phone</label>
                <input className="sf-input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone number" inputMode="numeric" />
              </div>
            </div>

            {/* Current items */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Bill Items</div>
              {editItems.length === 0 ? (
                <div className="sf-empty" style={{ padding: '16px 0' }}><AlertCircle /><div className="sf-empty-desc">No items — add products below</div></div>
              ) : (
                <div className="sf-table-wrap">
                  <table className="sf-table">
                    <thead><tr><th>Product</th><th>Code</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead>
                    <tbody>
                      {editItems.map((item) => (
                        <tr key={item._key}>
                          <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                          <td style={{ fontSize: 12, color: '#64748b' }}>{item.product_code}</td>
                          <td>{fmtINR(item.unit_price)}</td>
                          <td>
                            <div className="psc-qty-ctrl" style={{ width: 90 }}>
                              <button className="psc-qty-btn" onClick={() => setItemQty(item._key, item.quantity - 1)}><Minus style={{ width: 10, height: 10 }} /></button>
                              <input
                                className="psc-qty-input" type="text" inputMode="numeric"
                                value={item.quantity}
                                onChange={(e) => setItemQty(item._key, e.target.value.replace(/\D/g, '') || '0')}
                              />
                              <button className="psc-qty-btn" onClick={() => setItemQty(item._key, item.quantity + 1)}><Plus style={{ width: 10, height: 10 }} /></button>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700 }}>{fmtINR(item.line_total)}</td>
                          <td>
                            <button className="sf-btn sf-btn-sm" style={{ color: '#dc2626', background: '#fee2e2', border: '1px solid #fca5a5' }}
                              onClick={() => setEditItems((prev) => prev.filter((i) => i._key !== item._key))}>
                              <Trash2 style={{ width: 13, height: 13 }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Extra discount */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>Extra Discount:</div>
              <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <button className={`sf-btn sf-btn-sm${discType === 'flat' ? ' sf-btn-primary' : ' sf-btn-secondary'}`} style={{ borderRadius: 0 }} onClick={() => setDiscType('flat')}>₹ Flat</button>
                <button className={`sf-btn sf-btn-sm${discType === 'percent' ? ' sf-btn-primary' : ' sf-btn-secondary'}`} style={{ borderRadius: 0 }} onClick={() => setDiscType('percent')}>% Percent</button>
              </div>
              <input className="sf-input" style={{ width: 100 }} type="text" inputMode="numeric"
                value={discVal} onChange={(e) => setDiscVal(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder={discType === 'flat' ? '₹ 0' : '0 %'} />
            </div>

            {/* Totals */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Subtotal: {fmtINR(totals.subtotal)}</div>
              {totals.discount_total > 0 && <div style={{ fontSize: 13, color: '#16a34a' }}>Discount: −{fmtINR(totals.discount_total)}</div>}
              <div style={{ fontSize: 17, fontWeight: 800, color: '#15803d' }}>Grand Total: {fmtINR(totals.grand_total)}</div>
            </div>

            {/* Product search */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Add Products</div>
              <div className="sf-input-wrap" style={{ marginBottom: 10 }}>
                <Search className="sf-input-icon" />
                <input className="sf-input with-icon" placeholder="Search by name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="product-search-grid">
                {filteredProducts.slice(0, 30).map((p) => {
                  const billItem = editItems.find((i) => i.product_id === p.id);
                  const qty = billItem?.quantity || 0;
                  return (
                    <div key={p.id} className={`product-search-card${qty > 0 ? ' in-bill' : ''}`}
                      onClick={qty === 0 ? () => addProduct(p) : undefined}
                      style={{ cursor: qty === 0 ? 'pointer' : 'default' }}>
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="product-search-img" loading="lazy" />
                        : <div className="product-search-img-placeholder"><Package style={{ width: 24, height: 24 }} /></div>}
                      <div className="product-search-body">
                        <div className="product-search-name">{p.name}</div>
                        <div className="product-search-code">#{p.product_code}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                          <div className="product-search-price">{fmtINR(p.price)}</div>
                          {qty > 0 ? (
                            <div className="psc-qty-ctrl" onClick={(e) => e.stopPropagation()}>
                              <button className="psc-qty-btn" onClick={() => setItemQty(billItem._key, qty - 1)}><Minus style={{ width: 10, height: 10 }} /></button>
                              <input className="psc-qty-input" type="text" inputMode="numeric" value={qty}
                                onChange={(e) => { setItemQty(billItem._key, e.target.value.replace(/\D/g, '') || '0'); }}
                                onClick={(e) => e.stopPropagation()} />
                              <button className="psc-qty-btn" onClick={() => addProduct(p)}><Plus style={{ width: 10, height: 10 }} /></button>
                            </div>
                          ) : (
                            <button className="psc-add-btn" onClick={(e) => { e.stopPropagation(); addProduct(p); }}><Plus style={{ width: 12, height: 12 }} /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="sf-modal-footer">
          <button className="sf-btn sf-btn-secondary" onClick={() => onClose(false)} disabled={saving}>Cancel</button>
          <button className="sf-btn sf-btn-primary" onClick={handleSave} disabled={saving || loading}>
            <Save style={{ width: 14, height: 14 }} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBillingOrders() {
  const [orders, setOrders] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [datePreset, setDatePreset] = useState('today');
  const [selYear, setSelYear] = useState(String(new Date().getFullYear()));
  const [maxDataYear, setMaxDataYear] = useState(new Date().getFullYear());
  const [detailId, setDetailId] = useState(null);
  const [editId, setEditId] = useState(null);

  const handleDelete = async (order) => {
    if (!window.confirm(`Delete bill ${order.bill_number}? This cannot be undone.`)) return;
    const { error } = await supabase.from('billing_orders').delete().eq('id', order.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Bill ${order.bill_number} deleted`);
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
  };

  const loadStaff = useCallback(async () => {
    const [staffRes, maxYearRes] = await Promise.all([
      supabase.from('staff_users').select('id, name').eq('role', 'staff').order('name'),
      supabase.from('billing_orders').select('created_at').order('created_at', { ascending: false }).limit(1),
    ]);
    setStaffList(staffRes.data || []);
    if (maxYearRes.data?.[0]) {
      const y = new Date(maxYearRes.data[0].created_at).getFullYear();
      setMaxDataYear(y);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('billing_orders')
      .select('id, bill_number, staff_id, grand_total, subtotal, discount_total, status, created_at, finalized_at, staff_users(name)')
      .order('created_at', { ascending: false });

    const range = getDateRange(datePreset);
    if (range) {
      q = q.gte('created_at', range.start).lte('created_at', range.end);
    } else {
      // 'all time' — apply year filter
      const { start, end } = istYearRange(selYear);
      q = q.gte('created_at', start).lte('created_at', end);
    }
    if (staffFilter) q = q.eq('staff_id', staffFilter);
    if (statusFilter) q = q.eq('status', statusFilter);

    const { data } = await q;
    let rows = (data || []).map((o) => ({ ...o, staff_name: o.staff_users?.name || '—' }));

    if (search.trim()) {
      const s = search.toLowerCase();
      rows = rows.filter((o) => o.bill_number?.toLowerCase().includes(s) || o.staff_name?.toLowerCase().includes(s));
    }
    setOrders(rows);
    setLoading(false);
  }, [datePreset, selYear, staffFilter, statusFilter, search]);

  useEffect(() => { loadStaff(); }, [loadStaff]);
  useEffect(() => { loadOrders(); }, [loadOrders]);

  const totalSales = orders
    .filter((o) => o.status === 'finalized')
    .reduce((s, o) => s + Number(o.grand_total || 0), 0);

  return (
    <div className="staff-root" style={{ background: 'transparent' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>Staff Billing Orders</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
            {orders.filter((o) => o.status === 'finalized').length} finalized · Total: {fmtINR(totalSales)}
          </p>
        </div>
      </div>

      <div className="sf-card" style={{ marginBottom: 16 }}>
        <div className="sf-card-body" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            <div className="sf-input-wrap" style={{ flex: 1, minWidth: 200 }}>
              <Search className="sf-input-icon" />
              <input
                className="sf-input with-icon"
                placeholder="Search by bill number or staff name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <CustomSelect
              value={staffFilter}
              onChange={setStaffFilter}
              options={[{ value: '', label: 'All Staff' }, ...staffList.map((s) => ({ value: s.id, label: s.name }))]}
              minWidth={150}
            />
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'finalized', label: 'Finalized' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              minWidth={150}
            />
            <CustomSelect
              value={selYear}
              onChange={(y) => { setSelYear(y); setDatePreset('all'); }}
              options={getYearOptions(maxDataYear)}
              minWidth={90}
            />
          </div>

          <div className="sf-filter-chips" style={{ marginBottom: 0 }}>
            {DATE_PRESETS.map((p) => (
              <button key={p.value} className={`sf-chip${datePreset === p.value ? ' active' : ''}`} onClick={() => setDatePreset(p.value)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="sf-card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="adm-skeleton" style={{ width: 110, height: 16 }} />
                <div className="adm-skeleton" style={{ width: 72, height: 22, borderRadius: 20 }} />
              </div>
              <div className="adm-skeleton" style={{ width: 90, height: 12, marginBottom: 8 }} />
              <div className="adm-skeleton" style={{ width: 130, height: 12, marginBottom: 14 }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div className="adm-skeleton" style={{ flex: 1, height: 48, borderRadius: 8 }} />
                <div className="adm-skeleton" style={{ flex: 1, height: 48, borderRadius: 8 }} />
              </div>
              <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <div className="adm-skeleton" style={{ flex: 1, height: 32, borderRadius: 8 }} />
                <div className="adm-skeleton" style={{ flex: 1, height: 32, borderRadius: 8 }} />
                <div className="adm-skeleton" style={{ width: 36, height: 32, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="sf-card">
          <div className="sf-empty">
            <ClipboardList />
            <div className="sf-empty-title">No orders found</div>
            <div className="sf-empty-desc">Try adjusting your filters</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {orders.map((o) => (
            <div key={o.id} className="sf-card" style={{ padding: '16px 18px' }}>
              {/* Top: bill number + status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{o.bill_number}</div>
                <span className={`sf-badge ${o.status}`}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span>
              </div>

              {/* Staff + date */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{o.staff_name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>{formatIST(o.created_at)}</div>

              {/* Amounts */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, background: '#f8fafc', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{fmtINR(o.subtotal)}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 2 }}>Subtotal</div>
                </div>
                {Number(o.discount_total) > 0 && (
                  <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>−{fmtINR(o.discount_total)}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 2 }}>Discount</div>
                  </div>
                )}
                <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#15803d' }}>{fmtINR(o.grand_total)}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 2 }}>Total</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <button className="sf-btn sf-btn-secondary sf-btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDetailId(o.id)}>
                  <Eye style={{ width: 13, height: 13 }} /> View
                </button>
                {o.status !== 'cancelled' && (
                  <button className="sf-btn sf-btn-sm" style={{ flex: 1, justifyContent: 'center', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }} onClick={() => setEditId(o.id)}>
                    <Edit2 style={{ width: 13, height: 13 }} /> Edit
                  </button>
                )}
                <button className="sf-btn sf-btn-sm" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }} onClick={() => handleDelete(o)}>
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailId && (
        <OrderDetailModal
          orderId={detailId}
          onClose={(reload) => {
            setDetailId(null);
            if (reload) loadOrders();
          }}
        />
      )}

      {editId && (
        <EditOrderModal
          orderId={editId}
          onClose={(reload) => {
            setEditId(null);
            if (reload) loadOrders();
          }}
        />
      )}
    </div>
  );
}
