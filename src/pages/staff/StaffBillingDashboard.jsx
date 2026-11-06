import { useQuery } from '@tanstack/react-query';
import { BarChart2, Receipt, TrendingUp, CalendarDays, Clock, IndianRupee } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { fmtINR, formatIST, istDayStart, istDayEnd } from '../../utils/billingUtils';

const DATE_PRESETS = [
  { label: 'Today',        value: 'today' },
  { label: 'Yesterday',    value: 'yesterday' },
  { label: 'Last 7 Days',  value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'All Time',     value: 'all' },
];

import { useState } from 'react';

function getRange(preset) {
  switch (preset) {
    case 'today':     return { start: istDayStart(0), end: istDayEnd(0) };
    case 'yesterday': return { start: istDayStart(1), end: istDayEnd(1) };
    case '7d':        return { start: istDayStart(6), end: istDayEnd(0) };
    case '30d':       return { start: istDayStart(29), end: istDayEnd(0) };
    default:          return null;
  }
}

export default function StaffBillingDashboard() {
  const { user } = useAuth();
  const [preset, setPreset] = useState('today');

  const { data, isLoading } = useQuery({
    queryKey: ['staff-billing-dash', user?.id],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('billing_orders')
        .select('id, bill_number, grand_total, subtotal, discount_total, status, created_at, finalized_at, customer_name')
        .eq('staff_id', user.id)
        .eq('status', 'finalized')
        .order('finalized_at', { ascending: false });

      if (error) throw error;
      return orders || [];
    },
    enabled: !!user,
    staleTime: 0,
  });

  const allOrders = data || [];

  function filterByRange(orders, p) {
    const range = getRange(p);
    if (!range) return orders;
    return orders.filter(o => {
      const t = o.finalized_at || o.created_at;
      return t >= range.start && t <= range.end;
    });
  }

  const filtered    = filterByRange(allOrders, preset);
  const orderCount  = filtered.length;
  const totalSales  = filtered.reduce((s, o) => s + Number(o.grand_total || 0), 0);
  const totalDisc   = filtered.reduce((s, o) => s + Number(o.discount_total || 0), 0);
  const avgBill     = orderCount > 0 ? totalSales / orderCount : 0;

  // Totals for quick overview cards (always today + all-time)
  const todayOrders  = filterByRange(allOrders, 'today');
  const todayCount   = todayOrders.length;
  const todayTotal   = todayOrders.reduce((s, o) => s + Number(o.grand_total || 0), 0);
  const allTimeCount = allOrders.length;
  const allTimeTotal = allOrders.reduce((s, o) => s + Number(o.grand_total || 0), 0);

  const statCard = (icon, iconCls, value, label) => (
    <div className="sf-stat">
      <div className={`sf-stat-icon ${iconCls}`}>{icon}</div>
      <div>
        <div className="sf-stat-val" style={{ fontSize: 18 }}>{value}</div>
        <div className="sf-stat-lbl">{label}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 style={{ width: 22, height: 22, color: '#6366f1' }} />
          Billing Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Your billing stats and performance overview.</p>
      </div>

      {/* Overview cards — always today & all-time */}
      <div className="sf-stat-grid" style={{ marginBottom: 24 }}>
        {statCard(<TrendingUp />, 'blue', isLoading ? '—' : todayCount, "Today's Bills")}
        {statCard(<IndianRupee />, 'green', isLoading ? '—' : fmtINR(todayTotal), "Today's Sales")}
        {statCard(<Receipt />, 'purple', isLoading ? '—' : allTimeCount, 'Total Bills')}
        {statCard(<CalendarDays />, 'orange', isLoading ? '—' : fmtINR(allTimeTotal), 'All-Time Sales')}
      </div>

      {/* Date filter */}
      <div className="sf-card" style={{ marginBottom: 20 }}>
        <div className="sf-card-header" style={{ paddingBottom: 12 }}>
          <span className="sf-card-title">Filter by Period</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 16px 16px' }}>
          {DATE_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: preset === p.value ? '2px solid #6366f1' : '1px solid #e2e8f0',
                background: preset === p.value ? '#eef2ff' : '#f8fafc',
                color: preset === p.value ? '#4f46e5' : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filtered stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, padding: '0 16px 16px' }}>
          {[
            { label: 'Orders', value: isLoading ? '—' : orderCount },
            { label: 'Total Sales', value: isLoading ? '—' : fmtINR(totalSales) },
            { label: 'Avg Bill', value: isLoading ? '—' : fmtINR(avgBill) },
            { label: 'Total Discount', value: isLoading ? '—' : fmtINR(totalDisc) },
          ].map(s => (
            <div key={s.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent bills in selected range */}
      <div className="sf-card">
        <div className="sf-card-header">
          <span className="sf-card-title">
            Bills — {DATE_PRESETS.find(p => p.value === preset)?.label}
          </span>
          <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 700 }}>{orderCount} orders</span>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="sf-empty">
            <Clock />
            <div className="sf-empty-title">No bills in this period</div>
            <div className="sf-empty-desc">Try selecting a wider date range.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Bill No.', 'Customer', 'Date', 'Subtotal', 'Discount', 'Grand Total'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <tr key={o.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>{o.bill_number}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{o.customer_name || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', whiteSpace: 'nowrap', fontSize: 12 }}>{formatIST(o.finalized_at || o.created_at)}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{fmtINR(o.subtotal)}</td>
                    <td style={{ padding: '10px 14px', color: '#ea580c' }}>{Number(o.discount_total) > 0 ? `−${fmtINR(o.discount_total)}` : '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#15803d' }}>{fmtINR(o.grand_total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f0fdf4', borderTop: '2px solid #bbf7d0' }}>
                  <td colSpan={3} style={{ padding: '10px 14px', fontWeight: 700, color: '#15803d', fontSize: 13 }}>Total ({orderCount} bills)</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>{fmtINR(filtered.reduce((s, o) => s + Number(o.subtotal || 0), 0))}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#ea580c' }}>−{fmtINR(totalDisc)}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 800, color: '#15803d', fontSize: 15 }}>{fmtINR(totalSales)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
