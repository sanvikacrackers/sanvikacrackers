import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ClipboardList, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatIST, fmtINR, istDayStart, istDayEnd } from '../../utils/billingUtils';

const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'All time', value: 'all' },
];

function getDateRange(preset) {
  switch (preset) {
    case 'today':
      return { start: istDayStart(0), end: istDayEnd(0) };
    case 'yesterday':
      return { start: istDayStart(1), end: istDayEnd(1) };
    case '7d':
      return { start: istDayStart(6), end: istDayEnd(0) };
    case '30d':
      return { start: istDayStart(29), end: istDayEnd(0) };
    default:
      return null;
  }
}

export default function StaffOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      let q = supabase
        .from('billing_orders')
        .select('id, bill_number, grand_total, subtotal, discount_total, status, created_at, finalized_at')
        .eq('staff_id', user.id)
        .order('created_at', { ascending: false });

      const range = getDateRange(datePreset);
      if (range) {
        q = q.gte('created_at', range.start).lte('created_at', range.end);
      }
      if (statusFilter) q = q.eq('status', statusFilter);

      const { data } = await q;
      let filtered = data || [];

      if (search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter((o) => o.bill_number?.toLowerCase().includes(s));
      }
      setOrders(filtered);
      setLoading(false);
    };
    load();
  }, [user, datePreset, statusFilter, search]);

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

      <div className="sf-card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>
        ) : orders.length === 0 ? (
          <div className="sf-empty">
            <ClipboardList />
            <div className="sf-empty-title">No orders found</div>
            <div className="sf-empty-desc">
              {search || statusFilter || datePreset !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first bill to get started'}
            </div>
          </div>
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table sf-table-card">
              <thead>
                <tr>
                  <th>Bill Number</th>
                  <th>Date &amp; Time</th>
                  <th>Subtotal</th>
                  <th>Discount</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td data-label="Bill No." style={{ fontWeight: 700 }}>{o.bill_number}</td>
                    <td data-label="Date" style={{ fontSize: 12, color: '#64748b' }}>{formatIST(o.created_at)}</td>
                    <td data-label="Subtotal">{fmtINR(o.subtotal)}</td>
                    <td data-label="Discount" style={{ color: '#16a34a' }}>
                      {o.discount_total > 0 ? `−${fmtINR(o.discount_total)}` : '—'}
                    </td>
                    <td data-label="Total" style={{ fontWeight: 700 }}>{fmtINR(o.grand_total)}</td>
                    <td data-label="Status">
                      <span className={`sf-badge ${o.status}`}>
                        {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Link
                          to={`/staff/orders/${o.id}`}
                          style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}
                        >
                          View
                        </Link>
                        {o.status !== 'cancelled' && (
                          <Link
                            to={`/staff/orders/${o.id}?edit=true`}
                            title="Edit bill"
                            style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}
                          >
                            <Pencil style={{ width: 14, height: 14 }} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
