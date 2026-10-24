import { useCallback, useEffect, useState } from 'react';
import { Search, X, Printer, Eye, ClipboardList, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { formatIST, fmtINR, istDayStart, istDayEnd } from '../../utils/billingUtils';
import '../../Staff.css';

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

export default function AdminBillingOrders() {
  const [orders, setOrders] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [datePreset, setDatePreset] = useState('today');
  const [detailId, setDetailId] = useState(null);

  const loadStaff = useCallback(async () => {
    const { data } = await supabase.from('staff_users').select('id, name').eq('role', 'staff').order('name');
    setStaffList(data || []);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('billing_orders')
      .select('id, bill_number, staff_id, grand_total, subtotal, discount_total, status, created_at, finalized_at, staff_users(name)')
      .order('created_at', { ascending: false });

    const range = getDateRange(datePreset);
    if (range) q = q.gte('created_at', range.start).lte('created_at', range.end);
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
  }, [datePreset, staffFilter, statusFilter, search]);

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
            <select className="sf-input" style={{ width: 'auto' }} value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
              <option value="">All staff</option>
              {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="sf-input" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
              <option value="cancelled">Cancelled</option>
            </select>
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

      <div className="sf-card">
        {loading ? (
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead>
                <tr>
                  <th>Bill Number</th><th>Staff</th><th>Date &amp; Time</th>
                  <th>Subtotal</th><th>Discount</th><th>Grand Total</th>
                  <th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td><div className="adm-skeleton" style={{ width: 100, height: 15 }} /></td>
                    <td><div className="adm-skeleton" style={{ width: 80, height: 14 }} /></td>
                    <td><div className="adm-skeleton" style={{ width: 130, height: 13 }} /></td>
                    <td><div className="adm-skeleton" style={{ width: 65, height: 14 }} /></td>
                    <td><div className="adm-skeleton" style={{ width: 28, height: 14 }} /></td>
                    <td><div className="adm-skeleton" style={{ width: 75, height: 15 }} /></td>
                    <td><div className="adm-skeleton" style={{ width: 72, height: 22, borderRadius: 20 }} /></td>
                    <td><div className="adm-skeleton" style={{ width: 32, height: 28, borderRadius: 6 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : orders.length === 0 ? (
          <div className="sf-empty">
            <ClipboardList />
            <div className="sf-empty-title">No orders found</div>
            <div className="sf-empty-desc">Try adjusting your filters</div>
          </div>
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead>
                <tr>
                  <th>Bill Number</th>
                  <th>Staff</th>
                  <th>Date &amp; Time</th>
                  <th>Subtotal</th>
                  <th>Discount</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700 }}>{o.bill_number}</td>
                    <td style={{ fontWeight: 600 }}>{o.staff_name}</td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{formatIST(o.created_at)}</td>
                    <td>{fmtINR(o.subtotal)}</td>
                    <td style={{ color: '#16a34a' }}>{Number(o.discount_total) > 0 ? `−${fmtINR(o.discount_total)}` : '—'}</td>
                    <td style={{ fontWeight: 700 }}>{fmtINR(o.grand_total)}</td>
                    <td><span className={`sf-badge ${o.status}`}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span></td>
                    <td>
                      <button
                        className="sf-btn sf-btn-secondary sf-btn-sm"
                        onClick={() => setDetailId(o.id)}
                        title="View details"
                      >
                        <Eye style={{ width: 13, height: 13 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailId && (
        <OrderDetailModal
          orderId={detailId}
          onClose={(reload) => {
            setDetailId(null);
            if (reload) loadOrders();
          }}
        />
      )}
    </div>
  );
}
