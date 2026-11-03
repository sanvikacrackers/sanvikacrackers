import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, ClipboardList, Eye, Package, Pencil, Printer, TrendingUp, Receipt, Clock, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatIST, fmtINR, istDayStart, istDayEnd } from '../../utils/billingUtils';

function printBill(order, items) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Bill ${order.bill_number}</title>
<style>body{font-family:'Courier New',monospace;background:#fff;color:#000;padding:10mm;max-width:148mm;margin:0 auto;}h1{text-align:center;font-size:18px;margin:0 0 4px;}.sub{text-align:center;font-size:11px;color:#555;margin-bottom:10px;}.meta{display:flex;justify-content:space-between;font-size:11px;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:8px;}.cust{font-size:11px;color:#333;margin-bottom:6px;border-bottom:1px dashed #ccc;padding-bottom:6px;}table{width:100%;border-collapse:collapse;font-size:11px;}th{border-bottom:1px solid #000;padding:4px 2px;text-align:left;}td{padding:4px 2px;border-bottom:1px dashed #ccc;}.totals{border-top:2px solid #000;margin-top:8px;padding-top:8px;}.row{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;}.grand{font-weight:900;font-size:15px;border-top:1px solid #000;padding-top:4px;margin-top:4px;}.footer{text-align:center;font-size:10px;color:#555;border-top:1px dashed #ccc;padding-top:8px;margin-top:12px;}</style></head><body>
<h1>Sanvika Crackers</h1><div class="sub">Quality Fireworks · +91 90477 09090 · sanvikacrackers.com</div>
<div class="meta"><div>Bill: <b>${order.bill_number}</b></div><div style="text-align:right">${formatIST(order.finalized_at || order.created_at)}</div></div>
${order.customer_name || order.customer_phone ? `<div class="cust">Customer: <b>${order.customer_name || '—'}</b>${order.customer_phone ? ' · ' + order.customer_phone : ''}</div>` : ''}
<table><tr><th>#</th><th>Product</th><th>Code</th><th>Qty</th><th>Price</th><th>Total</th></tr>
${items.map((it, idx) => `<tr><td>${idx+1}</td><td>${it.product_name}</td><td>${it.product_code}</td><td>${it.quantity}</td><td>${fmtINR(it.unit_price)}</td><td>${fmtINR(it.line_total)}</td></tr>`).join('')}
</table><div class="totals"><div class="row"><span>Subtotal</span><span>${fmtINR(order.subtotal)}</span></div>${Number(order.discount_total)>0?`<div class="row"><span>Discount</span><span>-${fmtINR(order.discount_total)}</span></div>`:''}<div class="row grand"><span>GRAND TOTAL</span><span>${fmtINR(order.grand_total)}</span></div></div>
<div class="footer">Thank you for shopping at Sanvika Crackers! Safe celebrations!</div></body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

export default function StaffDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['staff-dashboard', user?.id],
    queryFn: async () => {
      const todayStart = istDayStart(0);
      const todayEnd   = istDayEnd(0);

      const [finalizedRes, recentRes] = await Promise.all([
        supabase
          .from('billing_orders')
          .select('grand_total, finalized_at')
          .eq('staff_id', user.id)
          .eq('status', 'finalized'),
        supabase
          .from('billing_orders')
          .select('id, bill_number, grand_total, subtotal, discount_total, status, created_at, finalized_at, edited_by')
          .eq('staff_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const finalized   = finalizedRes.data || [];
      const todayOrders = finalized.filter(o => o.finalized_at >= todayStart && o.finalized_at <= todayEnd);
      return {
        stats: {
          today:      todayOrders.length,
          todayTotal: todayOrders.reduce((s, o) => s + Number(o.grand_total || 0), 0),
          allTime:    finalized.length,
        },
        recentOrders: recentRes.data || [],
      };
    },
    enabled: !!user,
  });

  const stats        = data?.stats        || { today: 0, todayTotal: 0, allTime: 0 };
  const recentOrders = data?.recentOrders || [];

  const handlePrint = async (o) => {
    const { data: items, error } = await supabase
      .from('billing_order_items').select('*').eq('order_id', o.id).order('created_at');
    if (error) { toast.error('Failed to load items'); return; }
    printBill(o, items);
  };

  const handleDelete = async (o) => {
    if (!window.confirm(`Delete bill ${o.bill_number}? This cannot be undone.`)) return;
    const { error } = await supabase.from('billing_orders').delete().eq('id', o.id);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Bill deleted');
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
          Welcome back, {profile?.name || 'Staff'}!
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Here's your billing summary for today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="sf-stat-grid">
        <div className="sf-stat">
          <div className="sf-stat-icon blue"><TrendingUp /></div>
          <div>
            <div className="sf-stat-val">{isLoading ? '—' : stats.today}</div>
            <div className="sf-stat-lbl">Bills Today</div>
          </div>
        </div>
        <div className="sf-stat">
          <div className="sf-stat-icon green"><Receipt /></div>
          <div>
            <div className="sf-stat-val" style={{ fontSize: 18 }}>
              {isLoading ? '—' : fmtINR(stats.todayTotal)}
            </div>
            <div className="sf-stat-lbl">Today's Sales</div>
          </div>
        </div>
        <div className="sf-stat">
          <div className="sf-stat-icon purple"><ClipboardList /></div>
          <div>
            <div className="sf-stat-val">{isLoading ? '—' : stats.allTime}</div>
            <div className="sf-stat-lbl">Total Bills</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="sf-quick-actions" style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link to="/staff/new-bill" className="sf-btn sf-btn-primary sf-btn-lg">
          <Plus style={{ width: 18, height: 18 }} />
          New Bill
        </Link>
        <Link to="/staff/products" className="sf-btn sf-btn-secondary">
          <Package style={{ width: 15, height: 15 }} />
          Browse Products
        </Link>
        <Link to="/staff/orders" className="sf-btn sf-btn-secondary">
          <ClipboardList style={{ width: 15, height: 15 }} />
          My Orders
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="sf-card">
        <div className="sf-card-header">
          <span className="sf-card-title">Recent Orders</span>
          <Link to="/staff/orders" style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>
        ) : recentOrders.length === 0 ? (
          <div className="sf-empty">
            <Clock />
            <div className="sf-empty-title">No orders yet</div>
            <div className="sf-empty-desc">Create your first bill to get started.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, padding: '0 16px 16px' }}>
            {recentOrders.map((o) => (
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
                  <button className="sf-btn sf-btn-sm" style={{ justifyContent: 'center', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }} onClick={() => handleDelete(o)}>
                    <Trash2 style={{ width: 13, height: 13 }} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
