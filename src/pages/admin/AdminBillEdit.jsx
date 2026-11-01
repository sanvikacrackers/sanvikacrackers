import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Search, Plus, Minus, Trash2, Package, Save, User, Phone, X, AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { fmtINR, calcBillTotals, calcLineTotal } from '../../utils/billingUtils';
import '../../Staff.css';

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
  const [codeOnly, setCodeOnly] = useState(true);
  const q = query.trim();

  const filtered = products.filter((p) => {
    if (!p.is_active) return false;
    if (!q) return true;
    if (codeOnly) return p.product_code?.toLowerCase() === q.toLowerCase();
    const ql = q.toLowerCase();
    return (
      p.name?.toLowerCase().includes(ql)
      || p.product_code?.toLowerCase().includes(ql)
      || p.barcode?.toLowerCase().includes(ql)
      || p.category?.toLowerCase().includes(ql)
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <div className="sf-input-wrap" style={{ flex: 1 }}>
          <Search className="sf-input-icon" />
          <input className="sf-input with-icon" placeholder={codeOnly ? 'Type product code…' : 'Search by name, code, or barcode…'}
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}># Code</span>
          <div onClick={() => setCodeOnly(v => !v)} style={{ width: 36, height: 20, borderRadius: 10, background: codeOnly ? '#1d4ed8' : '#cbd5e1', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 2, left: codeOnly ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
          </div>
        </label>
      </div>

      {q && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '6px 10px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: '#92400e' }}>
            <strong>{filtered.length}</strong> result{filtered.length !== 1 ? 's' : ''} for "<strong>{q}</strong>"
          </span>
          <button onClick={() => setQuery('')} style={{ fontSize: 12, fontWeight: 700, color: '#b45309', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 6 }}>
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
            <div key={p.id} className={`product-search-card${qty > 0 ? ' in-bill' : ''}`}
              onClick={qty === 0 ? () => onAdd(p) : undefined}
              style={{ cursor: qty === 0 ? 'pointer' : 'default' }}>
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
                      <input className="psc-qty-input" type="text" inputMode="numeric" value={qty}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); onSetQty(billItem._key, v || '0'); }}
                        onClick={(e) => e.stopPropagation()} />
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

export default function AdminBillEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [editItems, setEditItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discType, setDiscType] = useState('flat');
  const [discVal, setDiscVal] = useState('');
  const [saving, setSaving] = useState(false);
  const initRef = useRef(false);

  // Load order + items
  const { data, isLoading: loadingOrder } = useQuery({
    queryKey: ['billing-order-edit', id],
    queryFn: async () => {
      const [oRes, iRes] = await Promise.all([
        supabase.from('billing_orders').select('*').eq('id', id).single(),
        supabase.from('billing_order_items').select('*').eq('order_id', id).order('created_at'),
      ]);
      if (oRes.error) throw new Error('Order not found');
      return { order: oRes.data, items: iRes.data || [] };
    },
  });

  // Initialize edit state once
  useEffect(() => {
    if (!data || initRef.current) return;
    initRef.current = true;
    const { order, items } = data;
    setCustomerName(order.customer_name || '');
    setCustomerPhone(order.customer_phone || '');
    if (Number(order.discount_total) > 0) {
      setDiscType('flat');
      setDiscVal(String(Number(order.discount_total)));
    }
    setEditItems(items.map((i) => ({
      _key: i.id,
      product_id: i.product_id,
      product_name: i.product_name,
      product_code: i.product_code,
      unit_price: Number(i.unit_price),
      quantity: i.quantity,
      discount_amount: Number(i.discount_amount || 0),
      line_total: Number(i.line_total),
    })));
  }, [data]);

  // Load products
  const { data: products = [] } = useQuery({
    queryKey: ['admin-products-active'],
    queryFn: async () => {
      const { data: d } = await supabase
        .from('products')
        .select('id,product_code,name,category,price,discount_percentage,barcode,image_url,is_active')
        .eq('is_active', true)
        .order('product_code');
      return d || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const addProduct = useCallback((p) => {
    setEditItems((prev) => {
      const ex = prev.find((i) => i.product_id === p.id);
      if (ex) {
        const qty = ex.quantity + 1;
        const rest = prev.filter((i) => i.product_id !== p.id);
        return [{ ...ex, quantity: qty, line_total: calcLineTotal(qty, ex.unit_price, ex.discount_amount) }, ...rest];
      }
      const unit_price = Number(p.price) || 0;
      return [{
        _key: crypto.randomUUID(),
        product_id: p.id,
        product_name: p.name,
        product_code: p.product_code,
        unit_price,
        quantity: 1,
        discount_amount: 0,
        line_total: calcLineTotal(1, unit_price, 0),
      }, ...prev];
    });
    toast.success(`${p.name} added`, { duration: 1000, position: 'bottom-center' });
  }, []);

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
    if (n > 999) toast.error('Maximum quantity is 999', { id: 'qty-max', duration: 2000 });
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
  const totals = {
    subtotal: baseTotals.subtotal,
    discount_total: Math.round((baseTotals.discount_total + extraDiscount) * 100) / 100,
    grand_total: Math.max(0, Math.round((baseTotals.grand_total - extraDiscount) * 100) / 100),
  };

  const handleSave = async () => {
    if (editItems.length === 0) { toast.error('Bill must have at least one item'); return; }
    setSaving(true);
    try {
      const [{ error: oErr }, { error: dErr }] = await Promise.all([
        supabase.from('billing_orders').update({
          subtotal: totals.subtotal,
          discount_total: totals.discount_total,
          grand_total: totals.grand_total,
          customer_name: customerName.trim() || null,
          customer_phone: customerPhone.trim() || null,
          edited_by: 'Admin',
        }).eq('id', id),
        supabase.from('billing_order_items').delete().eq('order_id', id),
      ]);
      if (oErr) throw new Error(oErr.message);
      if (dErr) throw new Error(dErr.message);

      const { error: iErr } = await supabase.from('billing_order_items').insert(
        editItems.map((i) => ({
          order_id: id,
          product_id: i.product_id,
          product_name: i.product_name,
          product_code: i.product_code,
          unit_price: i.unit_price,
          quantity: i.quantity,
          discount_amount: i.discount_amount,
          line_total: i.line_total,
        }))
      );
      if (iErr) throw new Error(iErr.message);

      queryClient.invalidateQueries({ queryKey: ['admin-billing-orders'] });
      queryClient.invalidateQueries({ queryKey: ['billing-order-edit', id] });
      queryClient.invalidateQueries({ queryKey: ['billing-order-detail', id] });
      toast.success('Bill updated successfully!');
      navigate('/admin/billing-orders');
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingOrder && !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>;
  }

  const order = data?.order;

  return (
    <div className="staff-root" style={{ background: 'transparent' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Link to="/admin/billing-orders" className="sf-btn sf-btn-ghost sf-btn-sm">
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Editing Bill</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{order?.bill_number}</div>
        </div>
      </div>

      <div className="bill-page">
        {/* ── Left: Cart ── */}
        <div className="bill-cart bill-cart-col">
          <div className="bill-cart-header">
            <span>Bill Items</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>{editItems.length} item{editItems.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Customer */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="sf-input-wrap" style={{ flex: 1 }}>
                <User className="sf-input-icon" style={{ width: 14, height: 14 }} />
                <input className="sf-input with-icon" placeholder="Customer name" value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)} style={{ fontSize: 12, height: 34 }} />
              </div>
              <div className="sf-input-wrap" style={{ flex: 1 }}>
                <Phone className="sf-input-icon" style={{ width: 14, height: 14 }} />
                <input className="sf-input with-icon" placeholder="Phone" value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  inputMode="numeric" style={{ fontSize: 12, height: 34 }} maxLength={10} />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bill-cart-items">
            {editItems.length === 0 ? (
              <div className="sf-empty" style={{ padding: '30px 16px' }}>
                <Package /><div className="sf-empty-desc">Search and add products →</div>
              </div>
            ) : (
              editItems.map((item) => (
                <div key={item._key} className="bill-cart-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="bill-cart-item-name" title={item.product_name}>{item.product_name}</div>
                    <div className="bill-cart-item-code">#{item.product_code}</div>
                    <div className="bill-qty-ctrl">
                      <button className="bill-qty-btn" onClick={() => updateQty(item._key, -1)}>
                        <Minus style={{ width: 10, height: 10 }} />
                      </button>
                      <input
                        className="bill-qty-val" type="text" inputMode="numeric" value={item.quantity}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setItemQty(item._key, v || '0'); }}
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

          {/* Discount + Totals */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid #e2e8f0' }}>
            {/* Discount row */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>Discount:</div>
              <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <button className={`sf-btn sf-btn-sm${discType === 'flat' ? ' sf-btn-primary' : ' sf-btn-secondary'}`} style={{ borderRadius: 0, padding: '0 8px', height: 28, fontSize: 11 }} onClick={() => setDiscType('flat')}>₹ Flat</button>
                <button className={`sf-btn sf-btn-sm${discType === 'percent' ? ' sf-btn-primary' : ' sf-btn-secondary'}`} style={{ borderRadius: 0, padding: '0 8px', height: 28, fontSize: 11 }} onClick={() => setDiscType('percent')}>% Off</button>
              </div>
              <input className="sf-input" style={{ width: 80, height: 28, fontSize: 12 }} type="text" inputMode="numeric"
                value={discVal} onChange={(e) => setDiscVal(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder={discType === 'flat' ? '₹ 0' : '0 %'} />
            </div>

            <div className="bill-cart-totals" style={{ marginTop: 0 }}>
              {totals.discount_total > 0 && (
                <div className="bill-total-row">
                  <span style={{ color: '#64748b' }}>Subtotal</span>
                  <span style={{ color: '#64748b' }}>{fmtINR(totals.subtotal)}</span>
                </div>
              )}
              {totals.discount_total > 0 && (
                <div className="bill-total-row">
                  <span style={{ color: '#16a34a' }}>Discount</span>
                  <span style={{ color: '#16a34a' }}>−{fmtINR(totals.discount_total)}</span>
                </div>
              )}
              <div className="bill-total-row grand">
                <span>Grand Total</span>
                <span className="bill-grand-amt">{fmtINR(totals.grand_total)}</span>
              </div>
            </div>
            <div className="bill-cart-actions">
              <button className="sf-btn sf-btn-success sf-btn-block" onClick={handleSave} disabled={saving || editItems.length === 0}>
                <Save style={{ width: 16, height: 16 }} />
                {saving ? 'Saving…' : `Save — ${fmtINR(totals.grand_total)}`}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Product search ── */}
        <div className="bill-search-col">
          <div className="sf-card">
            <div className="sf-card-header">
              <span className="sf-card-title">Add Products</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{products.length} products</span>
            </div>
            <div className="sf-card-body">
              <ProductSearch
                products={products}
                billItems={editItems}
                onAdd={addProduct}
                onDecrement={(key) => updateQty(key, -1)}
                onSetQty={setItemQty}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
