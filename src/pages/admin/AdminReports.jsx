import { useCallback, useEffect, useState } from 'react';
import { TrendingUp, Users, Receipt, BarChart2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatISTDate, fmtINR, istDayStart, istDayEnd } from '../../utils/billingUtils';
import { CustomSelect } from '../Admin';
import '../../Staff.css';

const BUSINESS_START_YEAR = 2025;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PRESETS = [
  { label: 'Today',       value: 'today' },
  { label: 'Yesterday',   value: 'yesterday' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days',value: '30d' },
];

/* ── Year list: BUSINESS_START_YEAR → max(currentYear, maxDataYear) ── */
function getYearOptions(maxYear) {
  const top = Math.max(maxYear, new Date().getFullYear());
  const opts = [];
  for (let y = top; y >= BUSINESS_START_YEAR; y--) {
    opts.push({ value: String(y), label: String(y) });
  }
  return opts;
}

/* ── Month list for a year (no future months if current year) ── */
function getMonthOptions(year) {
  const now = new Date();
  const limit = Number(year) === now.getFullYear() ? now.getMonth() : 11;
  return MONTH_NAMES.slice(0, limit + 1).map((label, idx) => ({
    value: String(idx),
    label,
  }));
}

/* ── IST full-month range ── */
function istMonthRange(year, month) {
  const IST = 330 * 60 * 1000;
  const y = Number(year), m = Number(month);
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0) - IST).toISOString();
  const lastDay = new Date(Date.UTC(y, m + 1, 0));
  const end = new Date(Date.UTC(lastDay.getUTCFullYear(), lastDay.getUTCMonth(), lastDay.getUTCDate(), 23, 59, 59, 999) - IST).toISOString();
  return { start, end };
}

function getPresetRange(preset) {
  switch (preset) {
    case 'today':     return { start: istDayStart(0),  end: istDayEnd(0) };
    case 'yesterday': return { start: istDayStart(1),  end: istDayEnd(1) };
    case '7d':        return { start: istDayStart(6),  end: istDayEnd(0) };
    case '30d':       return { start: istDayStart(29), end: istDayEnd(0) };
    default:          return { start: istDayStart(29), end: istDayEnd(0) };
  }
}

export default function AdminReports() {
  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();

  const [mode,        setMode]       = useState('today');
  const [selYear,     setSelYear]    = useState(String(currentYear));
  const [selMonth,    setSelMonth]   = useState(String(currentMonth));
  const [maxDataYear, setMaxDataYear] = useState(currentYear);
  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState({ totalSales: 0, billCount: 0, avgBill: 0, activeStaff: 0, activeProducts: 0 });
  const [byStaff,  setByStaff]  = useState([]);
  const [byDay,    setByDay]    = useState([]);

  const handleYearChange = (y) => {
    setSelYear(y);
    const maxMonth = Number(y) === currentYear ? currentMonth : 11;
    if (Number(selMonth) > maxMonth) setSelMonth(String(maxMonth));
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const { start, end } = mode === 'monthly'
      ? istMonthRange(selYear, selMonth)
      : getPresetRange(mode);

    const [ordersRes, staffRes, productsRes] = await Promise.all([
      supabase
        .from('billing_orders')
        .select('id, grand_total, staff_id, finalized_at, staff_users(name)')
        .eq('status', 'finalized')
        .gte('finalized_at', start)
        .lte('finalized_at', end),
      supabase.from('staff_users').select('id', { count: 'exact', head: true }).eq('role', 'staff').eq('is_active', true),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    const orders     = ordersRes.data || [];
    const totalSales = orders.reduce((s, o) => s + Number(o.grand_total || 0), 0);
    const billCount  = orders.length;
    const avgBill    = billCount > 0 ? totalSales / billCount : 0;

    const staffMap = {};
    for (const o of orders) {
      const name = o.staff_users?.name || 'Unknown';
      if (!staffMap[o.staff_id]) staffMap[o.staff_id] = { name, count: 0, total: 0 };
      staffMap[o.staff_id].count++;
      staffMap[o.staff_id].total += Number(o.grand_total || 0);
    }

    const dayMap = {};
    for (const o of orders) {
      if (!o.finalized_at) continue;
      const day = formatISTDate(o.finalized_at);
      if (!dayMap[day]) dayMap[day] = { day, count: 0, total: 0 };
      dayMap[day].count++;
      dayMap[day].total += Number(o.grand_total || 0);
    }

    setStats({ totalSales, billCount, avgBill, activeStaff: staffRes.count || 0, activeProducts: productsRes.count || 0 });
    setByStaff(Object.values(staffMap).sort((a, b) => b.total - a.total));
    setByDay(Object.values(dayMap).sort((a, b) => a.day < b.day ? -1 : 1));
    setLoading(false);
  }, [mode, selYear, selMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  // Fetch max year from DB once on mount so future-dated data appears in dropdown
  useEffect(() => {
    supabase.from('billing_orders')
      .select('finalized_at')
      .order('finalized_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          const y = new Date(data[0].finalized_at).getFullYear();
          setMaxDataYear((prev) => Math.max(prev, y));
        }
      });
  }, []);

  const maxDayTotal  = Math.max(...byDay.map((d) => d.total), 1);
  const yearOptions  = getYearOptions(maxDataYear);
  const monthOptions = getMonthOptions(selYear);

  const periodLabel = mode === 'monthly'
    ? `${MONTH_NAMES[Number(selMonth)]} ${selYear}`
    : PRESETS.find((p) => p.value === mode)?.label;

  return (
    <div className="staff-root" style={{ background: 'transparent' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>Reports &amp; Analytics</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Year always visible at top */}
          <CustomSelect
            value={selYear}
            onChange={handleYearChange}
            options={yearOptions}
            minWidth={90}
          />
          <button className="sf-btn sf-btn-secondary sf-btn-sm" onClick={loadData} disabled={loading}>
            <RefreshCw style={{ width: 13, height: 13 }} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Filter chips + month (only when monthly mode) ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <div className="sf-filter-chips" style={{ marginBottom: 0 }}>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              className={`sf-chip${mode === p.value ? ' active' : ''}`}
              onClick={() => setMode(p.value)}
            >
              {p.label}
            </button>
          ))}
          <button
            className={`sf-chip${mode === 'monthly' ? ' active' : ''}`}
            onClick={() => setMode('monthly')}
          >
            Monthly
          </button>
        </div>

        {mode === 'monthly' && (
          <CustomSelect
            value={selMonth}
            onChange={setSelMonth}
            options={monthOptions}
            minWidth={130}
          />
        )}
      </div>

      {/* ── Summary stats ── */}
      <div className="sf-stat-grid" style={{ marginBottom: 24 }}>
        <div className="sf-stat">
          <div className="sf-stat-icon green"><TrendingUp /></div>
          <div>
            <div className="sf-stat-val" style={{ fontSize: 18 }}>{loading ? '—' : fmtINR(stats.totalSales)}</div>
            <div className="sf-stat-lbl">Total Sales</div>
          </div>
        </div>
        <div className="sf-stat">
          <div className="sf-stat-icon blue"><Receipt /></div>
          <div>
            <div className="sf-stat-val">{loading ? '—' : stats.billCount}</div>
            <div className="sf-stat-lbl">Bills Finalized</div>
          </div>
        </div>
        <div className="sf-stat">
          <div className="sf-stat-icon orange"><BarChart2 /></div>
          <div>
            <div className="sf-stat-val" style={{ fontSize: 18 }}>{loading ? '—' : fmtINR(stats.avgBill)}</div>
            <div className="sf-stat-lbl">Average Bill</div>
          </div>
        </div>
        <div className="sf-stat">
          <div className="sf-stat-icon purple"><Users /></div>
          <div>
            <div className="sf-stat-val">{loading ? '—' : stats.activeStaff}</div>
            <div className="sf-stat-lbl">Active Staff</div>
          </div>
        </div>
      </div>

      {/* ── Two cards — stacks on mobile via reports-grid ── */}
      <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Sales by staff */}
        <div className="sf-card">
          <div className="sf-card-header">
            <span className="sf-card-title">Sales by Staff</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>{periodLabel}</span>
          </div>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading…</div>
          ) : byStaff.length === 0 ? (
            <div className="sf-empty"><div className="sf-empty-desc">No finalized orders in this period</div></div>
          ) : (
            <div className="sf-table-wrap">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>Staff</th><th>Bills</th><th>Total Sales</th><th>% Share</th>
                  </tr>
                </thead>
                <tbody>
                  {byStaff.map((row) => {
                    const pct = stats.totalSales > 0 ? ((row.total / stats.totalSales) * 100).toFixed(1) : '0';
                    return (
                      <tr key={row.name}>
                        <td style={{ fontWeight: 600 }}>{row.name}</td>
                        <td>{row.count}</td>
                        <td style={{ fontWeight: 700 }}>{fmtINR(row.total)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ height: 6, width: `${pct}%`, minWidth: 4, background: '#1d4ed8', borderRadius: 3, maxWidth: 80 }} />
                            <span style={{ fontSize: 11, color: '#64748b' }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Daily sales trend */}
        <div className="sf-card">
          <div className="sf-card-header">
            <span className="sf-card-title">Daily Sales Trend</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>{periodLabel}</span>
          </div>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading…</div>
          ) : byDay.length === 0 ? (
            <div className="sf-empty"><div className="sf-empty-desc">No data in this period</div></div>
          ) : (
            <div style={{ padding: 16 }}>
              {byDay.map((row) => (
                <div key={row.day} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{row.day}</span>
                    <span style={{ color: '#64748b' }}>{row.count} bills · <strong style={{ color: '#1e293b' }}>{fmtINR(row.total)}</strong></span>
                  </div>
                  <div style={{ background: '#f1f5f9', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(row.total / maxDayTotal) * 100}%`, background: 'linear-gradient(90deg, #1d4ed8, #60a5fa)', borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <div style={{ marginTop: 16, padding: '10px 16px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#64748b', border: '1px solid #e2e8f0' }}>
        <strong style={{ color: '#1e293b' }}>{stats.activeProducts}</strong> active products in the catalogue
      </div>
    </div>
  );
}
