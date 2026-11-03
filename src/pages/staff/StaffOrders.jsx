import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ClipboardList, Eye, Pencil, Printer, Trash2, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatIST, fmtINR, istDayStart, istDayEnd } from '../../utils/billingUtils';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

const DATE_PRESETS = [
  { label: 'Today',       value: 'today' },
  { label: 'Yesterday',   value: 'yesterday' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days',value: '30d' },
  { label: 'All time',    value: 'all' },
];

function getDateRange(preset) {
  switch (preset) {
    case 'today':     return { start: istDayStart(0), end: istDayEnd(0) };
    case 'yesterday': return { start: istDayStart(1), end: istDayEnd(1) };
    case '7d':        return { start: istDayStart(6), end: istDayEnd(0) };
    case '30d':       return { start: istDayStart(29), end: istDayEnd(0) };
    default:          return null;
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
<div class="sub">Quality Fireworks · +91 90477 09090 · sanvikacrackers.com</div>
<div class="meta">
  <div><div>Bill: <b>${order.bill_number}</b></div></div>
  <div style="text-align:right"><div>${formatIST(order.finalized_at || order.created_at)}</div></div>
</div>
${order.customer_name || order.customer_phone ? `<div class="cust">Customer: <b>${order.customer_name || '—'}</b>${order.customer_phone ? ' · ' + order.customer_phone : ''}</div>` : ''}
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
<div class="footer">Thank you for shopping at Sanvika Crackers! Safe celebrations!</div>
</body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

function DeleteModal({ order, onConfirm, onClose, deleting }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="sf-overlay">
      <div className="sf-modal" style={{ maxWidth: 400 }}>
        <div className="sf-modal-header">
          <span className="sf-modal-title">Delete Bill</span>
          <button className="sf-close-btn" onClick={onClose}><X /></button>
        </div>
        <div className="sf-modal-body" style={{ textAlign: 'center', padding: '24px 24px 8px' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: '#fee2e2', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <AlertTriangle style={{ width: 26, height: 26, color: '#dc2626' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
            Delete {order.bill_number}?
          </div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            This will permanently delete the bill and all its items. This action cannot be undone.
          </div>
        </div>
        <div className="sf-modal-footer">
          <button className="sf-btn sf-btn-secondary" onClick={onClose} disabled={deleting}>Cancel</button>
          <button className="sf-btn sf-btn-danger" onClick={onConfirm} disabled={deleting}>
            <Trash2 style={{ width: 14, height: 14 }} />
            {deleting ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffOrders() {
  const { user }        = useAuth();
  const queryClient     = useQueryClient();
  const [search, setSearch]           = useState('');
  const [datePreset, setDatePreset]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);

  const handlePrint = async (o) => {
    const { data: items, error } = await supabase
      .from('billing_order_items')
      .select('*')
      .eq('order_id', o.id)
      .order('created_at');
    if (error) { toast.error('Failed to load items'); return; }
    printBill(o, items);
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['staff-orders', user?.id, datePreset, statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('billing_orders')
        .select('id, bill_number, grand_total, subtotal, discount_total, status, created_at, finalized_at, edited_by')
        .eq('staff_id', user.id)
        .order('created_at', { ascending: false });

      const range = getDateRange(datePreset);
      if (range) q = q.gte('created_at', range.start).lte('created_at', range.end);
      if (statusFilter) q = q.eq('status', statusFilter);

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user,
  });

  // Search is filtered client-side — no extra API calls
  const filtered = search.trim()
    ? orders.filter(o => o.bill_number?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error: itemsErr } = await supabase
        .from('billing_order_items').delete().eq('order_id', deleteTarget.id);
      if (itemsErr) throw new Error(itemsErr.message);

      const { error: orderErr } = await supabase
        .from('billing_orders').delete().eq('id', deleteTarget.id);
      if (orderErr) throw new Error(orderErr.message);

      toast.success(`Bill ${deleteTarget.bill_number} deleted`);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['staff-orders'] });
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard'] });
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>My Orders</h1>
        <Link to="/staff/new-bill" className="sf-btn sf-btn-primary sf-btn-sm">
          + New Bill
        </Link>
      </div>

      {/* Filters */}
      <div className="sf-card" style={{ marginBottom: 16 }}>
        <div className="sf-card-body" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="sf-input-wrap" style={{ flex: 1, minWidth: 200 }}>
              <Search className="sf-input-icon" />
              <input
                className="sf-input with-icon"
                placeholder="Search by bill number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="sf-input"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="sf-filter-chips" style={{ marginTop: 10, marginBottom: 0 }}>
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                className={`sf-chip${datePreset === p.value ? ' active' : ''}`}
                onClick={() => setDatePreset(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="sf-card">
          <div className="sf-empty">
            <ClipboardList />
            <div className="sf-empty-title">No orders found</div>
            <div className="sf-empty-desc">
              {search || statusFilter || datePreset !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first bill to get started'}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map((o) => (
            <div key={o.id} className="sf-card" style={{ padding: '16px 18px' }}>
              {/* Top: bill number + status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: o.edited_by ? 6 : 10 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', whiteSpace: 'nowrap' }}>{o.bill_number}</div>
                <span className={`sf-badge ${o.status}`}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span>
              </div>
              {o.edited_by && (
                <div style={{ marginBottom: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                    Edited · {o.edited_by}
                  </span>
                </div>
              )}

              {/* Date */}
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>{formatIST(o.created_at)}</div>

              {/* Amounts */}
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Subtotal</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{fmtINR(o.subtotal)}</span>
                </div>
                {Number(o.discount_total) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Discount</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ea580c' }}>−{fmtINR(o.discount_total)}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#15803d' }}>{fmtINR(o.grand_total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <Link to={`/staff/orders/${o.id}`} className="sf-btn sf-btn-secondary sf-btn-sm" style={{ justifyContent: 'center', textDecoration: 'none' }}>
                  <Eye style={{ width: 13, height: 13 }} /> View
                </Link>
                <button className="sf-btn sf-btn-sm" style={{ justifyContent: 'center', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }} onClick={() => handlePrint(o)}>
                  <Printer style={{ width: 13, height: 13 }} /> Print
                </button>
                {o.status !== 'cancelled' ? (
                  <Link to={`/staff/orders/${o.id}?edit=true`} className="sf-btn sf-btn-sm" style={{ justifyContent: 'center', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', textDecoration: 'none' }}>
                    <Pencil style={{ width: 13, height: 13 }} /> Edit
                  </Link>
                ) : <div />}
                <button className="sf-btn sf-btn-sm" style={{ justifyContent: 'center', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }} onClick={() => setDeleteTarget(o)}>
                  <Trash2 style={{ width: 13, height: 13 }} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          order={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
