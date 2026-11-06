import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Receipt, TrendingUp, Users, IndianRupee, CalendarDays, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fmtINR, formatIST, istDayStart, istDayEnd } from '../../utils/billingUtils';

const DATE_PRESETS = [
  { label: 'Today',        value: 'today' },
  { label: 'Yesterday',    value: 'yesterday' },
  { label: 'Last 7 Days',  value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'All Time',     value: 'all' },
];

function getRange(preset) {
  switch (preset) {
    case 'today':     return { start: istDayStart(0), end: istDayEnd(0) };
    case 'yesterday': return { start: istDayStart(1), end: istDayEnd(1) };
    case '7d':        return { start: istDayStart(6), end: istDayEnd(0) };
    case '30d':       return { start: istDayStart(29), end: istDayEnd(0) };
    default:          return null;
  }
}

/* ── Shimmer skeleton helpers ── */
const shimmer = {
  background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
  backgroundSize: '200% 100%',
  animation: 'skshimmer 1.4s ease-in-out infinite',
  borderRadius: 6,
};

function Sk({ w = '100%', h = 16, r = 6, style = {} }) {
  return <div style={{ width: w, height: h, borderRadius: r, ...shimmer, ...style }} />;
}

function SkeletonStatCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Sk w={44} h={44} r={10} />
          <div style={{ flex: 1 }}>
            <Sk w="60%" h={20} style={{ marginBottom: 8 }} />
            <Sk w="80%" h={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonFilterCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
        <Sk w={120} h={16} />
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '14px 20px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Sk key={i} w={80} h={32} r={8} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, padding: '0 20px 20px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            <Sk w="50%" h={20} style={{ marginBottom: 8 }} />
            <Sk w="70%" h={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5, cols = 4, title }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Sk w={180} h={16} />
        <Sk w={60} h={14} />
      </div>
      <div style={{ padding: '0 0 4px' }}>
        {/* header row */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          {Array.from({ length: cols }).map((_, i) => <Sk key={i} h={11} w="60%" />)}
        </div>
        {/* data rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: r % 2 === 0 ? '#fff' : '#fafbfc' }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Sk key={c} h={13} w={c === 0 ? '70%' : c === cols - 1 ? '55%' : '80%'} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminBillingDashboard() {
  const [preset, setPreset] = useState('today');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-billing-dashboard'],
    queryFn: async () => {
      const [ordersRes, staffRes] = await Promise.all([
        supabase
          .from('billing_orders')
          .select('id, bill_number, grand_total, subtotal, discount_total, status, created_at, finalized_at, customer_name, staff_id')
          .eq('status', 'finalized')
          .order('finalized_at', { ascending: false }),
        supabase
          .from('staff_users')
          .select('id, name, email'),
      ]);
      return {
        orders: ordersRes.data || [],
        staff: staffRes.data || [],
      };
    },
    staleTime: 0,
  });

  const allOrders = data?.orders || [];
  const staffList = data?.staff  || [];

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

  const todayOrders  = filterByRange(allOrders, 'today');
  const todayCount   = todayOrders.length;
  const todayTotal   = todayOrders.reduce((s, o) => s + Number(o.grand_total || 0), 0);
  const allTimeCount = allOrders.length;
  const allTimeTotal = allOrders.reduce((s, o) => s + Number(o.grand_total || 0), 0);
  const activeStaff  = new Set(allOrders.map(o => o.staff_id)).size;

  const staffMap = {};
  filtered.forEach(o => {
    if (!staffMap[o.staff_id]) staffMap[o.staff_id] = { count: 0, total: 0 };
    staffMap[o.staff_id].count++;
    staffMap[o.staff_id].total += Number(o.grand_total || 0);
  });
  const staffRows = Object.entries(staffMap)
    .map(([id, s]) => {
      const p = staffList.find(x => x.id === id);
      return { name: p?.name || 'Unknown', email: p?.email || '', ...s };
    })
    .sort((a, b) => b.total - a.total);

  const cardStyle = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 };
  const iconBox = (bg, color) => ({ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 });

  function StatCard({ icon, iconBg, iconColor, value, label }) {
    return (
      <div style={cardStyle}>
        <div style={iconBox(iconBg, iconColor)}>{icon}</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{value}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{label}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes skshimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 style={{ width: 22, height: 22, color: '#6366f1' }} />
            Staff Billing Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Overview of all staff billing orders and revenue.</p>
        </div>

        {isLoading ? (
          <>
            <SkeletonStatCards />
            <SkeletonFilterCard />
            <SkeletonTable rows={4} cols={4} />
            <SkeletonTable rows={6} cols={7} />
          </>
        ) : (
          <>
            {/* Overview cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
              <StatCard icon={<TrendingUp size={20} />}   iconBg="#eff6ff" iconColor="#1d4ed8" value={todayCount}          label="Today's Bills" />
              <StatCard icon={<IndianRupee size={20} />}  iconBg="#f0fdf4" iconColor="#15803d" value={fmtINR(todayTotal)}  label="Today's Sales" />
              <StatCard icon={<Receipt size={20} />}      iconBg="#faf5ff" iconColor="#7c3aed" value={allTimeCount}        label="Total Bills" />
              <StatCard icon={<CalendarDays size={20} />} iconBg="#fff7ed" iconColor="#c2410c" value={fmtINR(allTimeTotal)} label="All-Time Sales" />
              <StatCard icon={<Users size={20} />}        iconBg="#fdf2f8" iconColor="#9d174d" value={activeStaff}         label="Active Staff" />
            </div>

            {/* Date filter */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Filter by Period</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '14px 20px' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, padding: '0 20px 20px' }}>
                {[
                  { label: 'Orders',         value: orderCount },
                  { label: 'Total Sales',    value: fmtINR(totalSales) },
                  { label: 'Avg Bill',       value: fmtINR(avgBill) },
                  { label: 'Total Discount', value: fmtINR(totalDisc) },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff breakdown */}
            {staffRows.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Staff Performance — {DATE_PRESETS.find(p => p.value === preset)?.label}</span>
                  <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 700 }}>{staffRows.length} staff</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Staff', 'Email', 'Bills', 'Total Sales'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {staffRows.map((s, i) => (
                        <tr key={s.email} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 700, color: '#1e293b' }}>{s.name}</td>
                          <td style={{ padding: '10px 16px', color: '#94a3b8', fontSize: 12 }}>{s.email}</td>
                          <td style={{ padding: '10px 16px', color: '#475569', fontWeight: 600 }}>{s.count}</td>
                          <td style={{ padding: '10px 16px', fontWeight: 800, color: '#15803d' }}>{fmtINR(s.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* All bills table */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                  All Bills — {DATE_PRESETS.find(p => p.value === preset)?.label}
                </span>
                <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 700 }}>{orderCount} orders</span>
              </div>

              {filtered.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center' }}>
                  <Clock style={{ width: 32, height: 32, color: '#cbd5e1', margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>No bills in this period</div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>Try selecting a wider date range.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Bill No.', 'Staff', 'Customer', 'Date', 'Subtotal', 'Discount', 'Grand Total'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((o, i) => {
                        const staffName = staffList.find(s => s.id === o.staff_id)?.name || '—';
                        return (
                          <tr key={o.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 16px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>{o.bill_number}</td>
                            <td style={{ padding: '10px 16px', color: '#475569', fontWeight: 600 }}>{staffName}</td>
                            <td style={{ padding: '10px 16px', color: '#64748b' }}>{o.customer_name || '—'}</td>
                            <td style={{ padding: '10px 16px', color: '#94a3b8', whiteSpace: 'nowrap', fontSize: 12 }}>{formatIST(o.finalized_at || o.created_at)}</td>
                            <td style={{ padding: '10px 16px', color: '#475569' }}>{fmtINR(o.subtotal)}</td>
                            <td style={{ padding: '10px 16px', color: '#ea580c' }}>{Number(o.discount_total) > 0 ? `−${fmtINR(o.discount_total)}` : '—'}</td>
                            <td style={{ padding: '10px 16px', fontWeight: 800, color: '#15803d' }}>{fmtINR(o.grand_total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f0fdf4', borderTop: '2px solid #bbf7d0' }}>
                        <td colSpan={4} style={{ padding: '10px 16px', fontWeight: 700, color: '#15803d', fontSize: 13 }}>Total ({orderCount} bills)</td>
                        <td style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>{fmtINR(filtered.reduce((s, o) => s + Number(o.subtotal || 0), 0))}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 700, color: '#ea580c' }}>−{fmtINR(totalDisc)}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 800, color: '#15803d', fontSize: 15 }}>{fmtINR(totalSales)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
